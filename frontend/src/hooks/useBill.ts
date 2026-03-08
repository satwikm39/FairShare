import { useState, useCallback } from 'react';
import { billsService } from '../services/bills';
import type { Bill } from '../types';

export function useBill(initialBillId: number) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBill = useCallback(async (id: number = initialBillId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await billsService.getBill(id);
      setBill(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch bill');
    } finally {
      setIsLoading(false);
    }
  }, [initialBillId]);

  const uploadReceipt = async (file: File) => {
    if (!bill) return;
    setIsLoading(true);
    setError(null);
    try {
      const newItems = await billsService.uploadReceipt(bill.id, file);
      // Optimistically update the bill with the new items
      setBill(prev => prev ? { ...prev, items: [...prev.items, ...newItems] } : null);
      return newItems;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload receipt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShare = async (itemId: number, userId: number, shareCount: number) => {
    // We could do optimistic UI updates here, but for simplicity we'll just await the API
    try {
      const updatedShare = await billsService.updateItemShare(itemId, userId, shareCount);
      
      // Update local state without full refetch
      setBill(prev => {
        if (!prev) return null;
        
        const updatedItems = prev.items.map(item => {
          if (item.id === itemId) {
            // Remove old share for this user if it exists, add the new one
            const filteredShares = item.shares.filter(s => s.user_id !== userId);
            return {
              ...item,
              shares: [...filteredShares, updatedShare]
            };
          }
          return item;
        });

        return { ...prev, items: updatedItems };
      });
    } catch (err: any) {
      console.error("Failed to update share:", err);
      // Ideally show a toast error here
    }
  };

  return {
    bill,
    isLoading,
    error,
    fetchBill,
    uploadReceipt,
    updateShare,
    setBill // Expose setter for optimistic updates inside components if needed
  };
}
