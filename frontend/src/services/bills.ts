import { api } from './api';
import type { Bill, BillItem, ItemShare } from '../types';
import { mockBillsService } from './mock/bills';
import { isDemoMode } from '../config/demo';

export const billsService = {
  /**
   * Fetch a bill and all its items by ID
   */
  getBill: async (billId: number): Promise<Bill> => {
    if (isDemoMode()) return mockBillsService.getBill(billId);
    const response = await api.get<Bill>(`/bills/${billId}`);
    return response.data;
  },

  /**
   * Delete a bill
   */
  deleteBill: async (billId: number): Promise<void> => {
    if (isDemoMode()) return mockBillsService.deleteBill(billId);
    await api.delete(`/bills/${billId}`);
  },

  /**
   * Update a bill's details (e.g. name, date, total_tax)
   */
  updateBill: async (billId: number, data: { name?: string | null; date?: string; total_tax?: number; paid_by_user_id?: number | null }): Promise<Bill> => {
    if (isDemoMode()) return mockBillsService.updateBill(billId, data);
    const response = await api.put<Bill>(`/bills/${billId}`, data);
    return response.data;
  },

  /**
   * Upload a receipt image for OCR processing via AWS Textract
   */
  uploadReceipt: async (billId: number, file: File): Promise<Bill> => {
    if (isDemoMode()) return mockBillsService.uploadReceipt(billId, file);
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<Bill>(
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
    if (isDemoMode()) return mockBillsService.updateItemShare(itemId, userId, shareCount);
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
    if (isDemoMode()) return mockBillsService.updateItemSharesBulk(billId, shares);
    const response = await api.post<ItemShare[]>(`/bills/${billId}/shares/bulk`, shares);
    return response.data;
  },

  /**
   * Atomically save table state: new rows (negative temp_id), item patches, tax, and all shares.
   */
  syncBillTable: async (
    billId: number,
    body: {
      shares: { item_id: number; user_id: number; share_count: number }[];
      item_updates: { id: number; item_name?: string; unit_cost?: number }[];
      total_tax?: number;
      new_items: { temp_id: number; item_name: string; unit_cost: number }[];
    }
  ): Promise<Bill> => {
    if (isDemoMode()) return mockBillsService.syncBillTable(billId, body);
    const response = await api.put<Bill>(`/bills/${billId}/table-sync`, body);
    return response.data;
  },

  /**
   * Update the details (name/cost) of a specific item
   */
  updateItem: async (
    itemId: number,
    data: { item_name?: string; unit_cost?: number }
  ): Promise<BillItem> => {
    if (isDemoMode()) return mockBillsService.updateItem(itemId, data);
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
    if (isDemoMode()) return mockBillsService.addItem(billId, item);
    const response = await api.post<BillItem>(`/bills/${billId}/items/`, item);
    return response.data;
  },

  /**
   * Delete an item from a bill
   */
  deleteItem: async (itemId: number): Promise<void> => {
    if (isDemoMode()) return mockBillsService.deleteItem(itemId);
    await api.delete(`/bills/items/${itemId}`);
  },

  /**
   * Remove a user from a bill (shares and participant status)
   */
  removeUserFromBill: async (billId: number, userId: number): Promise<void> => {
    if (isDemoMode()) return mockBillsService.removeUserFromBill(billId, userId);
    await api.delete(`/bills/${billId}/members/${userId}`);
  },

  /**
   * Add a group member as a participant on a bill
   */
  addParticipantToBill: async (billId: number, userId: number): Promise<void> => {
    if (isDemoMode()) return mockBillsService.addParticipantToBill(billId, userId);
    await api.post(`/bills/${billId}/members/${userId}`);
  },
};
