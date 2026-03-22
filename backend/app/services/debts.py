"""
Shared helper to recompute and cache pairwise debts for a group.
Call this after any change to bill payer or item shares in a group.
"""
from collections import defaultdict
from sqlalchemy.orm import Session
from app import models, crud


def recompute_group_debts(db: Session, group_id: int) -> None:
    """
    Recompute simplified pairwise debts for a group from all bills + shares.
    Writes results to the `debts` table (delete-then-insert).
    """
    db_group = crud.groups.get_group(db, group_id=group_id)
    if not db_group:
        return

    user_map: dict[int, str] = {m.user.id: m.user.name for m in db_group.members}

    # pairwise[debtor_id][creditor_id] = raw total owed
    pairwise: dict[int, dict[int, float]] = defaultdict(lambda: defaultdict(float))

    bills = crud.bills.get_bills_by_group(db, group_id=group_id)
    for bill in bills:
        if bill.paid_by_user_id is None:
            continue
        payer_id = bill.paid_by_user_id

        for item in bill.items:
            total_shares = sum(s.share_count for s in item.shares)
            if total_shares == 0:
                continue
            tax_fraction = (item.unit_cost / bill.subtotal * bill.total_tax) if bill.subtotal > 0 else 0
            item_total = item.unit_cost + tax_fraction

            for share in item.shares:
                if share.share_count == 0 or share.user_id == payer_id:
                    continue
                share_amount = (share.share_count / total_shares) * item_total
                pairwise[share.user_id][payer_id] += share_amount

    # Factor in settlements
    from app.crud.settlements import get_settlements_by_group
    settlements = get_settlements_by_group(db, group_id=group_id)
    for settlement in settlements:
        pairwise[settlement.from_user_id][settlement.to_user_id] -= settlement.amount

    simplified: list[tuple[int, int, float]] = []  # (from, to, amount)

    if not db_group.simplify_debts:
        # Simplify: net out A->B vs B->A only
        processed: set[tuple[int, int]] = set()
        for debtor_id, creditors in pairwise.items():
            for creditor_id, amount in creditors.items():
                pair = tuple(sorted([debtor_id, creditor_id]))
                if pair in processed:
                    continue
                processed.add(pair)  # type: ignore[arg-type]

                reverse = pairwise.get(creditor_id, {}).get(debtor_id, 0.0)
                net = amount - reverse

                if net > 0.005:
                    simplified.append((debtor_id, creditor_id, round(net, 2)))
                elif net < -0.005:
                    simplified.append((creditor_id, debtor_id, round(-net, 2)))
    else:
        # Smart Sync: globally simplify debts across the entire group
        net_balances: dict[int, float] = defaultdict(float)
        for debtor_id, creditors in pairwise.items():
            for creditor_id, amount in creditors.items():
                net_balances[debtor_id] -= amount
                net_balances[creditor_id] += amount
        
        # Split into debtors (negative) and creditors (positive)
        debtors = [{"id": u, "amt": round(-bal, 2)} for u, bal in net_balances.items() if bal < -0.005]
        creditors = [{"id": u, "amt": round(bal, 2)} for u, bal in net_balances.items() if bal > 0.005]
        
        # Sort by amount descending to minimize transactions
        debtors.sort(key=lambda x: x["amt"], reverse=True)
        creditors.sort(key=lambda x: x["amt"], reverse=True)
        
        d_idx, c_idx = 0, 0
        while d_idx < len(debtors) and c_idx < len(creditors):
            debtor = debtors[d_idx]
            creditor = creditors[c_idx]
            
            amount = min(debtor["amt"], creditor["amt"])
            if amount > 0:
                simplified.append((debtor["id"], creditor["id"], round(amount, 2)))
            
            debtor["amt"] = round(debtor["amt"] - amount, 2)
            creditor["amt"] = round(creditor["amt"] - amount, 2)
            
            if debtor["amt"] <= 0.005:
                d_idx += 1
            if creditor["amt"] <= 0.005:
                c_idx += 1

    # Atomic replace: delete old debts, insert new ones
    db.query(models.Debt).filter(models.Debt.group_id == group_id).delete()
    for from_id, to_id, amt in simplified:
        db.add(models.Debt(
            group_id=group_id,
            from_user_id=from_id,
            to_user_id=to_id,
            amount=amt
        ))
    db.commit()
