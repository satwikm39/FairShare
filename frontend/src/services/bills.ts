import { api } from './api';
import type { Bill, BillItem, ItemShare } from '../types';

export const billsService = {
  /**
   * Fetch a bill and all its items by ID
   */
  getBill: async (billId: number): Promise<Bill> => {
    const response = await api.get<Bill>(`/bills/${billId}`);
    return response.data;
  },

  /**
   * Delete a bill
   */
  deleteBill: async (billId: number): Promise<void> => {
    await api.delete(`/bills/${billId}`);
  },

  /**
   * Update a bill's details (e.g. name, date, total_tax)
   */
  updateBill: async (billId: number, data: { name?: string | null; date?: string; total_tax?: number; paid_by_user_id?: number | null }): Promise<Bill> => {
    const response = await api.put<Bill>(`/bills/${billId}`, data);
    return response.data;
  },

  /**
   * Upload a receipt image for OCR processing via AWS Textract
   */
  uploadReceipt: async (billId: number, file: File): Promise<BillItem[]> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<BillItem[]>(
      `/bills/${billId}/upload-receipt`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * Assign or update a user's share count for a specific item
   */
  updateItemShare: async (
    itemId: number,
    userId: number,
    shareCount: number
  ): Promise<ItemShare> => {
    const response = await api.post<ItemShare>(`/bills/items/${itemId}/shares/`, {
      user_id: userId,
      share_count: shareCount,
    });
    return response.data;
  },

  /**
   * Bulk assign or update multiple shares across multiple items in a bill
   */
  updateItemSharesBulk: async (
    billId: number,
    shares: { item_id: number; user_id: number; share_count: number }[]
  ): Promise<ItemShare[]> => {
    const response = await api.post<ItemShare[]>(`/bills/${billId}/shares/bulk`, shares);
    return response.data;
  },

  /**
   * Update the details (name/cost) of a specific item
   */
  updateItem: async (
    itemId: number,
    data: { item_name?: string; unit_cost?: number }
  ): Promise<BillItem> => {
    const response = await api.put<BillItem>(`/bills/items/${itemId}`, data);
    return response.data;
  },

  /**
   * Manually add a new item to a bill
   */
  addItem: async (
    billId: number,
    item: { item_name: string; unit_cost: number }
  ): Promise<BillItem> => {
    const response = await api.post<BillItem>(`/bills/${billId}/items/`, item);
    return response.data;
  },

  /**
   * Delete an item from a bill
   */
  deleteItem: async (itemId: number): Promise<void> => {
    await api.delete(`/bills/items/${itemId}`);
  },
};
