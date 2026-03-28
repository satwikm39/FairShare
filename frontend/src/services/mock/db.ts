import type { Group, Bill, BillItem, ItemShare, User, GroupMemberResponse } from '../../types';

export interface MockDBState {
  users: User[];
  groups: Group[];
  groupMembers: GroupMemberResponse[];
  bills: Bill[];
  billItems: BillItem[];
  itemShares: ItemShare[];
}

const DEMO_USER_ID = 999;
export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  email: "demo@fairshare.app",
  name: "Demo User",
  textract_usage_count: 0,
  is_admin: 0
};

const SEED_DATA: MockDBState = {
  users: [
    DEMO_USER,
    { id: 1001, email: "alice@example.com", name: "Alice Adams", textract_usage_count: 0, is_admin: 0 },
    { id: 1002, email: "bob@example.com", name: "Bob Barker", textract_usage_count: 0, is_admin: 0 },
    { id: 1003, email: "charlie@example.com", name: "Charlie Chaplin", textract_usage_count: 0, is_admin: 0 }
  ],
  groups: [
    { id: 101, name: "Weekend Ski Trip", currency: "$", simplify_debts: true, members: [] }
  ],
  groupMembers: [
    { user_id: DEMO_USER_ID, group_id: 101, user: DEMO_USER },
    { user_id: 1001, group_id: 101, user: { id: 1001, email: "alice@example.com", name: "Alice Adams", textract_usage_count: 0, is_admin: 0 } },
    { user_id: 1002, group_id: 101, user: { id: 1002, email: "bob@example.com", name: "Bob Barker", textract_usage_count: 0, is_admin: 0 } },
    { user_id: 1003, group_id: 101, user: { id: 1003, email: "charlie@example.com", name: "Charlie Chaplin", textract_usage_count: 0, is_admin: 0 } }
  ],
  bills: [
    {
      id: 201,
      group_id: 101,
      name: "Ski Passes",
      date: new Date().toISOString(),
      paid_by_user_id: 1001,
      subtotal: 400.00,
      total_tax: 20.00,
      grand_total: 420.00,
      receipt_image_url: null,
      items: [],
      participant_user_ids: [DEMO_USER_ID, 1001, 1002, 1003]
    },
    {
      id: 202,
      group_id: 101,
      name: "Cabin Groceries",
      date: new Date(Date.now() - 86400000).toISOString(),
      paid_by_user_id: DEMO_USER_ID,
      subtotal: 150.00,
      total_tax: 15.00,
      grand_total: 165.00,
      receipt_image_url: null,
      items: [],
      participant_user_ids: [DEMO_USER_ID, 1001, 1002]
    }
  ],
  billItems: [
    // Ski Passes (Equally split)
    { id: 301, bill_id: 201, item_name: "4x Weekend Lift Tickets", unit_cost: 400.00, shares: [] },
    // Groceries (Uneven split)
    { id: 302, bill_id: 202, item_name: "Snacks & Drinks", unit_cost: 100.00, shares: [] },
    { id: 303, bill_id: 202, item_name: "Expensive Wine (Alice)", unit_cost: 50.00, shares: [] },
  ],
  itemShares: [
    // Ski Passes shares
    { id: 401, item_id: 301, user_id: DEMO_USER_ID, share_count: 1 },
    { id: 402, item_id: 301, user_id: 1001, share_count: 1 },
    { id: 403, item_id: 301, user_id: 1002, share_count: 1 },
    { id: 404, item_id: 301, user_id: 1003, share_count: 1 },
    // Groceries - Snacks (shared by all except Charlie)
    { id: 405, item_id: 302, user_id: DEMO_USER_ID, share_count: 1 },
    { id: 406, item_id: 302, user_id: 1001, share_count: 1 },
    { id: 407, item_id: 302, user_id: 1002, share_count: 1 },
    // Groceries - Wine (Only Alice)
    { id: 408, item_id: 303, user_id: 1001, share_count: 1 }
  ]
};

const DB_KEY = 'fairshare_mock_db';

export class MockDB {
  static getState(): MockDBState {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      this.setState(SEED_DATA);
      return SEED_DATA;
    }
    return JSON.parse(raw);
  }

  static setState(state: MockDBState) {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
  }

  static generateId(): number {
    return Math.floor(Math.random() * 100000) + 1000;
  }

  static reset() {
    this.setState(SEED_DATA);
  }
}
