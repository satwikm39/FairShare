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
};
