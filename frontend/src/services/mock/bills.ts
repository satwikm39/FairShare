import { MockDB } from './db';
import type { Bill, BillItem, ItemShare } from '../../types';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const mockBillsService = {
  getBill: async (billId: number): Promise<Bill> => {
    await delay(300);
    const state = MockDB.getState();
    const bill = state.bills.find(b => b.id === billId);
    if (!bill) throw new Error("Bill not found");
    
    const items = state.billItems.filter(i => i.bill_id === billId);
    const itemsWithShares = items.map(item => {
      const shares = state.itemShares.filter(s => s.item_id === item.id);
      return { ...item, shares };
    });
    
    return { ...bill, items: itemsWithShares };
  },

  deleteBill: async (billId: number): Promise<void> => {
    await delay(400);
    const state = MockDB.getState();
    state.bills = state.bills.filter(b => b.id !== billId);
    MockDB.setState(state);
  },

  updateBill: async (billId: number, data: { name?: string | null; date?: string; total_tax?: number; paid_by_user_id?: number | null }): Promise<Bill> => {
    await delay(400);
    const state = MockDB.getState();
    const idx = state.bills.findIndex(b => b.id === billId);
    if (idx !== -1) {
      if (data.name !== undefined) state.bills[idx].name = data.name || "Unnamed Bill";
      if (data.date !== undefined) state.bills[idx].date = new Date(`${data.date}T00:00:00`).toISOString();
      if (data.total_tax !== undefined) state.bills[idx].total_tax = data.total_tax;
      if (data.paid_by_user_id !== undefined) {
        state.bills[idx].paid_by_user_id = data.paid_by_user_id;
      }
      // Recompute grand total
      state.bills[idx].grand_total = state.bills[idx].subtotal + state.bills[idx].total_tax;
      MockDB.setState(state);
    }
    return state.bills[idx];
  },

  uploadReceipt: async (billId: number, _file: File): Promise<BillItem[]> => {
    // Artificial 2.5s delay to simulate AWS Textract
    await delay(2500);
    const state = MockDB.getState();
    
    const mockExtractedItems = [
      { id: MockDB.generateId(), bill_id: billId, item_name: "Truffle Fries", unit_cost: 12.50, shares: [] },
      { id: MockDB.generateId(), bill_id: billId, item_name: "Wagyu Burger", unit_cost: 28.00, shares: [] },
      { id: MockDB.generateId(), bill_id: billId, item_name: "Craft Beer", unit_cost: 8.00, shares: [] },
      { id: MockDB.generateId(), bill_id: billId, item_name: "Craft Beer", unit_cost: 8.00, shares: [] },
      { id: MockDB.generateId(), bill_id: billId, item_name: "Margarita", unit_cost: 14.00, shares: [] }
    ];

    // Automatically add to mock DB
    state.billItems.push(...mockExtractedItems);
    
    const idx = state.bills.findIndex(b => b.id === billId);
    if (idx !== -1) {
       let subtotal = 0;
       state.billItems.filter(i => i.bill_id === billId).forEach(i => subtotal += i.unit_cost);
       state.bills[idx].subtotal = subtotal;
       state.bills[idx].total_tax = 6.25; // Fake parsed tax
       state.bills[idx].grand_total = subtotal + 6.25;
    }
    
    MockDB.setState(state);
    return mockExtractedItems;
  },

  updateItemShare: async (itemId: number, userId: number, shareCount: number): Promise<ItemShare> => {
    const state = MockDB.getState();
    const idx = state.itemShares.findIndex(s => s.item_id === itemId && s.user_id === userId);
    let share: ItemShare;
    if (idx !== -1) {
      state.itemShares[idx].share_count = shareCount;
      share = state.itemShares[idx];
    } else {
      share = { id: MockDB.generateId(), item_id: itemId, user_id: userId, share_count: shareCount };
      state.itemShares.push(share);
    }
    MockDB.setState(state);
    return share;
  },

  updateItemSharesBulk: async (_billId: number, shares: { item_id: number; user_id: number; share_count: number }[]): Promise<ItemShare[]> => {
    await delay(400);
    const state = MockDB.getState();
    const results: ItemShare[] = [];
    
    shares.forEach(incoming => {
      const idx = state.itemShares.findIndex(s => s.item_id === incoming.item_id && s.user_id === incoming.user_id);
      if (idx !== -1) {
         state.itemShares[idx].share_count = incoming.share_count;
         results.push(state.itemShares[idx]);
      } else {
         const newShare = { id: MockDB.generateId(), item_id: incoming.item_id, user_id: incoming.user_id, share_count: incoming.share_count };
         state.itemShares.push(newShare);
         results.push(newShare);
      }
    });

    MockDB.setState(state);
    return results;
  },

  syncBillTable: async (
    billId: number,
    body: {
      shares: { item_id: number; user_id: number; share_count: number }[];
      item_updates: { id: number; item_name?: string; unit_cost?: number }[];
      total_tax?: number;
      new_items: { temp_id: number; item_name: string; unit_cost: number }[];
    }
  ): Promise<Bill> => {
    await delay(600);
    const state = MockDB.getState();
    
    // Updates Items
    body.item_updates.forEach(u => {
      const idx = state.billItems.findIndex(i => i.id === u.id);
      if (idx !== -1) {
         if (u.item_name !== undefined) state.billItems[idx].item_name = u.item_name;
         if (u.unit_cost !== undefined) state.billItems[idx].unit_cost = u.unit_cost;
      }
    });

    // New Items
    const tempToRealMap: Record<number, number> = {};
    body.new_items.forEach(newItem => {
      const realId = MockDB.generateId();
      tempToRealMap[newItem.temp_id] = realId;
      state.billItems.push({
        id: realId,
        bill_id: billId,
        item_name: newItem.item_name,
        unit_cost: newItem.unit_cost,
        shares: []
      });
    });

    // Update Shares
    body.shares.forEach(incoming => {
      const realItemId = incoming.item_id < 0 ? tempToRealMap[incoming.item_id] : incoming.item_id;
      if (!realItemId) return;

      const idx = state.itemShares.findIndex(s => s.item_id === realItemId && s.user_id === incoming.user_id);
      if (idx !== -1) {
         state.itemShares[idx].share_count = incoming.share_count;
      } else {
         state.itemShares.push({ 
             id: MockDB.generateId(), 
             item_id: realItemId, 
             user_id: incoming.user_id, 
             share_count: incoming.share_count
         });
      }
    });

    // Update Bill Tax & Totals
    const bIdx = state.bills.findIndex(b => b.id === billId);
    if (bIdx !== -1) {
      if (body.total_tax !== undefined) state.bills[bIdx].total_tax = body.total_tax;
      let subtotal = 0;
      state.billItems.filter(i => i.bill_id === billId).forEach(i => subtotal += i.unit_cost);
      state.bills[bIdx].subtotal = subtotal;
      state.bills[bIdx].grand_total = subtotal + state.bills[bIdx].total_tax;
    }

    MockDB.setState(state);
    // Recursively call mockBillsService.getBill to format it correctly for return
    return mockBillsService.getBill(billId);
  },

  updateItem: async (itemId: number, data: { item_name?: string; unit_cost?: number }): Promise<BillItem> => {
    const state = MockDB.getState();
    const idx = state.billItems.findIndex(i => i.id === itemId);
    if (data.item_name !== undefined) state.billItems[idx].item_name = data.item_name;
    if (data.unit_cost !== undefined) state.billItems[idx].unit_cost = data.unit_cost;
    MockDB.setState(state);
    return state.billItems[idx];
  },

  addItem: async (billId: number, item: { item_name: string; unit_cost: number }): Promise<BillItem> => {
    await delay(300);
    const state = MockDB.getState();
    const newItem: BillItem = {
      id: MockDB.generateId(),
      bill_id: billId,
      item_name: item.item_name,
      unit_cost: item.unit_cost,
      shares: []
    };
    state.billItems.push(newItem);
    
    const bIdx = state.bills.findIndex(b => b.id === billId);
    if (bIdx !== -1) {
      state.bills[bIdx].subtotal += item.unit_cost;
      state.bills[bIdx].grand_total = state.bills[bIdx].subtotal + state.bills[bIdx].total_tax;
    }
    MockDB.setState(state);
    return newItem;
  },

  deleteItem: async (itemId: number): Promise<void> => {
    await delay(200);
    const state = MockDB.getState();
    const item = state.billItems.find(i => i.id === itemId);
    
    if (item) {
      state.billItems = state.billItems.filter(i => i.id !== itemId);
      state.itemShares = state.itemShares.filter(s => s.item_id !== itemId);
      
      const bIdx = state.bills.findIndex(b => b.id === item.bill_id);
      if (bIdx !== -1) {
        state.bills[bIdx].subtotal -= item.unit_cost;
        state.bills[bIdx].grand_total = state.bills[bIdx].subtotal + state.bills[bIdx].total_tax;
      }
      MockDB.setState(state);
    }
  },

  removeUserFromBill: async (billId: number, userId: number): Promise<void> => {
     await delay(300);
     const state = MockDB.getState();
     // remove from participant list
     const bIdx = state.bills.findIndex(b => b.id === billId);
     if (bIdx !== -1) {
       state.bills[bIdx].participant_user_ids = state.bills[bIdx].participant_user_ids?.filter(id => id !== userId);
     }
     
     // zero out shares
     const itemsInBill = state.billItems.filter(i => i.bill_id === billId).map(i => i.id);
     state.itemShares = state.itemShares.filter(s => !(itemsInBill.includes(s.item_id) && s.user_id === userId));
     MockDB.setState(state);
  },

  addParticipantToBill: async (billId: number, userId: number): Promise<void> => {
      await delay(300);
      const state = MockDB.getState();
      const bIdx = state.bills.findIndex(b => b.id === billId);
      if (bIdx !== -1 && !state.bills[bIdx].participant_user_ids?.includes(userId)) {
          state.bills[bIdx].participant_user_ids?.push(userId);
          MockDB.setState(state);
      }
  }
};
