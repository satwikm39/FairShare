# FairShare — Executive Summary

## What is FairShare?

A full-stack shared expense splitting web app — like Splitwise, but with a per-item weighted share model. Users assign integer share counts per item per person (e.g. 2:1:1), so each person pays exactly for what they consumed, with tax pro-rated accordingly.

---

## Core Capabilities

| Feature | Description |
|---|---|
| Item-by-item splitting | Weighted share counts per person per item |
| Receipt OCR | AWS Textract extracts items from uploaded photos (2 free scans/account) |
| Debt tracking | Splitwise-style: records payer per bill, computes and simplifies cumulative group debts |
| Debt caching | Pairwise debts cached in `debts` table; recomputed only on payer/share changes |
| Multi-currency | Per-group currency symbol |
| Auth | Firebase Google Sign-In; JWT verified on every backend route |

---

## Tech Stack

| | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind CSS (Vercel) |
| Backend | FastAPI Python 3.11 (Render) |
| Database | PostgreSQL via Supabase (SQLAlchemy + Alembic) |
| Auth | Firebase Admin SDK JWT verification |
| OCR | AWS Textract via Boto3 |

---

## Key Design Decisions

- **JWT auth on all routes** — real server-side security; CORS is a browser hint only
- **Debts cached in DB** — avoids recomputing O(bills × items × shares) on every read
- **Integer share counts** — more intuitive than percentages; no float drift
- **Tax pro-rated per item** — fair: heavy orderers pay proportionally more tax
- **Alembic for all migrations** — no `create_all()` in production

---

## Known Gaps / Future Work
- Some GET routes (bills, group bills list) are not yet auth-gated
- No settlement / "mark as paid" flow
- Textract premium tier not yet implemented
- No push notifications for new debts
