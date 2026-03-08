import { useState, useCallback } from 'react';
import { billsService } from '../services/bills';
import type { Bill } from '../types';

export function useBill(initialBillId: number) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingShares, setIsSavingShares] = useState(false);

  const fetchBill = useCallback(async (id: number = initialBillId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await billsService.getBill(id);
      setBill(data);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch bill');
    } finally {
      setIsLoading(false);
    }
  }, [initialBillId]);

  const uploadReceipt = async (file: File) => {
    const targetBillId = bill?.id || initialBillId;
    
    if (!targetBillId) {
      console.log("DEBUG: uploadReceipt hook called but `billId` is missing");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const newItems = await billsService.uploadReceipt(targetBillId, file);
      
      setBill(prev => prev ? { ...prev, items: [...prev.items, ...newItems] } : null);
      
      if (!bill) {
        await fetchBill(targetBillId);
      }
      
      return newItems;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload receipt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShare = (itemId: number, userId: number, shareCount: number) => {
    setBill(prev => {
      if (!prev) return null;
      
      const updatedItems = prev.items.map(item => {
        if (item.id === itemId) {
          const filteredShares = item.shares.filter(s => s.user_id !== userId);
          // Only add back the share if we are actually recording > 0, 
          // or we just track it as 0 to explicitly send deletion to backend
          const newShare = {
            id: Date.now(), // temporary ID for frontend tracking
            item_id: itemId,
            user_id: userId,
            share_count: shareCount
          };
          return {
            ...item,
            shares: [...filteredShares, newShare]
          };
        }
        return item;
      });

      return { ...prev, items: updatedItems };
    });
    setHasUnsavedChanges(true);
  };

  const splitAllEqually = (userIds: number[]) => {
    setBill(prev => {
      if (!prev) return null;
      
      const updatedItems = prev.items.map(item => {
        const newShares = userIds.map((userId, index) => ({
          id: Date.now() + item.id + index, // temporary ID for frontend tracking
          item_id: item.id,
          user_id: userId,
          share_count: 1
        }));
        return {
          ...item,
          shares: newShares
        };
      });

      return { ...prev, items: updatedItems };
    });
    setHasUnsavedChanges(true);
  };

  const saveShares = async () => {
    if (!bill) return;
    setIsSavingShares(true);
    setError(null);
    try {
      // Gather all shares from all items to send in bulk
      const sharesToSave = bill.items.flatMap(item => 
        item.shares.map(s => ({
          item_id: item.id,
          user_id: s.user_id,
          share_count: s.share_count
        }))
      );
      
      await billsService.updateItemSharesBulk(bill.id, sharesToSave);
      setHasUnsavedChanges(false);
      
      // Optionally refetch to get real IDs, but not strictly necessary since UI works fine
      // await fetchBill(bill.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save shares');
      throw err;
    } finally {
      setIsSavingShares(false);
    }
  };

  const deleteBill = async () => {
    setIsLoading(true);
    try {
      await billsService.deleteBill(initialBillId);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete bill');
      setIsLoading(false);
      throw err;
    }
  };

  return {
    bill,
    isLoading,
    error,
    hasUnsavedChanges,
    isSavingShares,
    fetchBill,
    uploadReceipt,
    updateShare,
    splitAllEqually,
    saveShares,
    deleteBill,
    setBill
  };
}
