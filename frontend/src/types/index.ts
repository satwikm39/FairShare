export interface Group {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
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
  total_tax: number;
  subtotal: number;
  grand_total: number;
  receipt_image_url: string | null;
  items: BillItem[];
}
