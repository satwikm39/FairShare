export interface GroupMemberResponse {
  user_id: number;
  group_id: number;
  user: User;
}

export interface Group {
  id: number;
  name: string;
  currency: string;
  members: GroupMemberResponse[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  textract_usage_count: number;
}

export interface ItemShare {
  id: number;
  item_id: number;
  user_id: number;
  share_count: number;
}

export interface BillItem {
  id: number;
  bill_id: number;
  item_name: string;
  unit_cost: number;
  shares: ItemShare[];
}

export interface Bill {
  id: number;
  group_id: number;
  name: string | null;
  date: string;
  total_tax: number;
  subtotal: number;
  grand_total: number;
  receipt_image_url: string | null;
  paid_by_user_id: number | null;
  items: BillItem[];
  participant_user_ids?: number[];
}

export interface UserBalance {
  user_id: number;
  user_name: string;
  net_amount: number; // positive = is owed, negative = owes
}

export interface DebtDetail {
  from_user_id: number;
  from_user_name: string;
  to_user_id: number;
  to_user_name: string;
  amount: number;
}

export interface GroupBalances {
  balances: UserBalance[];
  debts: DebtDetail[];
  my_net_amount: number;
}
