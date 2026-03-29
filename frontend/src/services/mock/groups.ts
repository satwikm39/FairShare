import { MockDB, DEMO_USER } from './db';
import type { Group, Bill, GroupBalances, Settlement } from '../../types';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const mockGroupsService = {
  getGroups: async (): Promise<Group[]> => {
    await delay(300);
    const state = MockDB.getState();
    return state.groups;
  },

  getGroup: async (groupId: number): Promise<Group> => {
    await delay(300);
    const state = MockDB.getState();
    const group = state.groups.find(g => g.id === groupId);
    if (!group) throw new Error("Group not found");
    
    // Attach members
    const members = state.groupMembers.filter(m => m.group_id === groupId);
    return { ...group, members };
  },

  createGroup: async (name: string, currency: string = '$'): Promise<Group> => {
    await delay(500);
    const state = MockDB.getState();
    const newGroup: Group = { id: MockDB.generateId(), name, currency, simplify_debts: true, members: [] };
    state.groups.push(newGroup);
    
    // Add current demo user to group automatically
    const newMember = { user_id: DEMO_USER.id, group_id: newGroup.id, user: DEMO_USER };
    state.groupMembers.push(newMember);

    MockDB.setState(state);
    return { ...newGroup, members: [newMember] };
  },

  deleteGroup: async (groupId: number): Promise<void> => {
    await delay(400);
    const state = MockDB.getState();
    state.groups = state.groups.filter(g => g.id !== groupId);
    state.groupMembers = state.groupMembers.filter(m => m.group_id !== groupId);
    MockDB.setState(state);
  },

  updateGroup: async (groupId: number, data: { name?: string; currency?: string; simplify_debts?: boolean }): Promise<Group> => {
    await delay(400);
    const state = MockDB.getState();
    const idx = state.groups.findIndex(g => g.id === groupId);
    if (idx === -1) throw new Error("Group not found");
    
    state.groups[idx] = { ...state.groups[idx], ...data };
    MockDB.setState(state);
    return state.groups[idx];
  },

  createSettlement: async (groupId: number, data: { from_user_id: number; to_user_id: number; amount: number; date?: string }): Promise<void> => {
    await delay(600);
    const state = MockDB.getState();
    const newSettlement: Settlement = {
      id: MockDB.generateId(),
      group_id: groupId,
      from_user_id: data.from_user_id,
      to_user_id: data.to_user_id,
      amount: data.amount,
      date: data.date || new Date().toISOString()
    };
    if (!state.settlements) state.settlements = [];
    state.settlements.push(newSettlement);
    MockDB.setState(state);
  },

  getSettlements: async (groupId: number): Promise<Settlement[]> => {
    await delay(300);
    const state = MockDB.getState();
    return (state.settlements || []).filter(s => s.group_id === groupId);
  },

  updateSettlement: async (_groupId: number, settlementId: number, data: { amount?: number; from_user_id?: number; to_user_id?: number; date?: string }): Promise<Settlement> => {
    await delay(400);
    const state = MockDB.getState();
    const settlements = state.settlements || [];
    const idx = settlements.findIndex(s => s.id === settlementId);
    if (idx === -1) throw new Error("Settlement not found");
    
    settlements[idx] = { ...settlements[idx], ...data };
    state.settlements = settlements;
    MockDB.setState(state);
    return settlements[idx];
  },

  deleteSettlement: async (_groupId: number, settlementId: number): Promise<void> => {
    await delay(300);
    const state = MockDB.getState();
    state.settlements = (state.settlements || []).filter(s => s.id !== settlementId);
    MockDB.setState(state);
  },

  addMemberByEmail: async (groupId: number, email: string): Promise<void> => {
    await delay(500);
    const state = MockDB.getState();
    // find or create mock user
    let user = state.users.find(u => u.email === email);
    if (!user) {
      user = { id: MockDB.generateId(), email, name: email.split('@')[0], textract_usage_count: 0 } as any;
      state.users.push(user as any);
    }
    
    if (!state.groupMembers.find(m => m.group_id === groupId && m.user_id === user!.id)) {
      state.groupMembers.push({ user_id: user!.id, group_id: groupId, user: user as any });
      MockDB.setState(state);
    }
  },

  removeGroupMember: async (groupId: number, userId: number): Promise<void> => {
    await delay(300);
    const state = MockDB.getState();
    state.groupMembers = state.groupMembers.filter(m => !(m.group_id === groupId && m.user_id === userId));
    MockDB.setState(state);
  },

  getGroupBills: async (groupId: number): Promise<Bill[]> => {
    await delay(300);
    const state = MockDB.getState();
    const bills = state.bills.filter(b => b.group_id === groupId);
    
    // Attach items and shares so the UI can compute balances
    return bills.map(bill => {
      const items = state.billItems.filter(i => i.bill_id === bill.id);
      const itemsWithShares = items.map(item => {
        const shares = state.itemShares.filter(s => s.item_id === item.id);
        return { ...item, shares };
      });
      return { ...bill, items: itemsWithShares };
    });
  },

  getGroupBalances: async (groupId: number): Promise<GroupBalances> => {
    await delay(400);
    // Rough simulation of backend balance computation
    const state = MockDB.getState();
    const bills = state.bills.filter(b => b.group_id === groupId);
    
    const balances: Record<number, number> = {};
    const detailed_balances: Record<number, { paid: number; owed_by_me: number }> = {};
    const group_members = state.groupMembers.filter(m => m.group_id === groupId);
    
    group_members.forEach(m => {
      balances[m.user_id] = 0;
      detailed_balances[m.user_id] = { paid: 0, owed_by_me: 0 };
    });

    let total_group_spending = 0;

    bills.forEach(bill => {
      total_group_spending += bill.grand_total;
      if (bill.paid_by_user_id) {
        if (!balances[bill.paid_by_user_id]) balances[bill.paid_by_user_id] = 0;
        balances[bill.paid_by_user_id] += bill.grand_total;
        
        if (!detailed_balances[bill.paid_by_user_id]) detailed_balances[bill.paid_by_user_id] = { paid: 0, owed_by_me: 0 };
        detailed_balances[bill.paid_by_user_id].paid += bill.grand_total;
      }

      const items = state.billItems.filter(i => i.bill_id === bill.id);
      items.forEach(item => {
        const shares = state.itemShares.filter(s => s.item_id === item.id);
        const totalShares = shares.reduce((sum, s) => sum + s.share_count, 0);
        if (totalShares > 0) {
          const itemRatio = item.unit_cost / bill.subtotal;
          const taxShare = bill.total_tax * itemRatio;
          const totalItemCost = item.unit_cost + (Number.isNaN(taxShare) ? 0 : taxShare);
          
          shares.forEach(share => {
            if (share.share_count > 0 && share.user_id) {
               const costShare = (share.share_count / totalShares) * totalItemCost;
               if (!balances[share.user_id]) balances[share.user_id] = 0;
               balances[share.user_id] -= costShare;
               
               if (!detailed_balances[share.user_id]) detailed_balances[share.user_id] = { paid: 0, owed_by_me: 0 };
               detailed_balances[share.user_id].owed_by_me += costShare;
            }
          });
        }
      });
    });

    // Simple debts simulation directly flowing to DEMO_USER
    const debts: any[] = [];
    const formattedBalances: any[] = [];
    Object.keys(balances).forEach(idStr => {
      const id = parseInt(idStr);
      const u = state.users.find(u => u.id === id);
      formattedBalances.push({
        user_id: id,
        user_name: u?.name || 'Unknown',
        net_amount: balances[id]
      });

      if (id !== DEMO_USER.id && balances[id] < -0.01) {
          debts.push({
            id: MockDB.generateId(),
            group_id: groupId,
            from_user_id: id,
            to_user_id: DEMO_USER.id,
            amount: Math.abs(balances[id]),
            from_user_name: u?.name || 'Unknown',
            to_user_name: DEMO_USER.name
          });
      } else if (id !== DEMO_USER.id && balances[id] > 0.01) {
          debts.push({
            id: MockDB.generateId(),
            group_id: groupId,
            from_user_id: DEMO_USER.id,
            to_user_id: id,
            amount: balances[id],
            from_user_name: DEMO_USER.name,
            to_user_name: u?.name || 'Unknown'
          });
      }
    });

    return {
      balances: formattedBalances,
      debts,
      my_net_amount: balances[DEMO_USER.id] || 0
    };
  },

  createBill: async (groupId: number, data?: { name: string; date: string; participant_user_ids: number[] }): Promise<Bill> => {
    await delay(400);
    const state = MockDB.getState();
    const newBill: Bill = {
      id: MockDB.generateId(),
      group_id: groupId,
      name: data?.name || "New Bill",
      date: data?.date ? new Date(`${data.date}T00:00:00`).toISOString() : new Date().toISOString(),
      paid_by_user_id: DEMO_USER.id,
      receipt_image_url: null,
      subtotal: 0,
      total_tax: 0,
      grand_total: 0,
      items: [],
      participant_user_ids: data?.participant_user_ids || [DEMO_USER.id]
    };
    state.bills.push(newBill);
    MockDB.setState(state);
    return newBill;
  }
};
