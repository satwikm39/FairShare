import { useState, useCallback, useEffect, useRef } from 'react';
import { billsService } from '../services/bills';
import { withRetries } from '../lib/retry';
import type { Bill, ItemShare } from '../types';

const AUTO_SAVE_DEBOUNCE_MS = 3000;
const SAVE_RETRY_DELAYS_MS = [1000, 2000, 4000];
const SAVE_MAX_RETRIES = 3;

function nextTempItemId(): number {
  return -Math.floor(Math.random() * 1_000_000_000) - 1;
}

export interface UseBillOptions {
  /** Called after all save retries failed (e.g. show toast). */
  onSaveFailed?: (message: string) => void;
}

export function useBill(initialBillId: number, options?: UseBillOptions) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingShares, setIsSavingShares] = useState(false);
  const [modifiedItems, setModifiedItems] = useState<Record<number, { item_name?: string; unit_cost?: number }>>({});
  const [modifiedTax, setModifiedTax] = useState<number | null>(null);

  const onSaveFailedRef = useRef(options?.onSaveFailed);
  useEffect(() => {
    onSaveFailedRef.current = options?.onSaveFailed;
  }, [options?.onSaveFailed]);

  const fetchBill = useCallback(async (id: number = initialBillId) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await billsService.getBill(id);
      setBill(data);
      setHasUnsavedChanges(false);
      setModifiedItems({});
      setModifiedTax(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch bill');
    } finally {
      setIsLoading(false);
    }
  }, [initialBillId]);

  const hasInvalidItems =
    bill?.items.some((item) => item.shares.reduce((sum, share) => sum + share.share_count, 0) === 0) ?? false;

  /** Single API attempt - no retries. */
  const syncBillToServer = useCallback(async () => {
    if (!bill) return;
    setIsSavingShares(true);
    setError(null);
    try {
      const newItems = bill.items
        .filter((i) => i.id < 0)
        .map((i) => ({
          temp_id: i.id,
          item_name: i.item_name,
          unit_cost: i.unit_cost,
        }));

      const sharesToSave = bill.items.flatMap((item) =>
        item.shares.map((s) => ({
          item_id: item.id,
          user_id: s.user_id,
          share_count: s.share_count,
        }))
      );

      const itemUpdates = Object.entries(modifiedItems).map(([itemId, data]) => ({
        id: Number(itemId),
        ...data,
      }));

      const updated = await billsService.syncBillTable(bill.id, {
        shares: sharesToSave,
        item_updates: itemUpdates,
        ...(modifiedTax !== null ? { total_tax: modifiedTax } : {}),
        new_items: newItems,
      });

      setBill(updated);
      setModifiedItems({});
      setModifiedTax(null);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save';
      setError(typeof msg === 'string' ? msg : 'Failed to save');
      throw err;
    } finally {
      setIsSavingShares(false);
    }
  }, [bill, modifiedItems, modifiedTax]);

  /**
   * Saves with up to 3 retries and backoff. On total failure, invokes onSaveFailed and rethrows.
   */
  const saveShares = useCallback(async () => {
    try {
      await withRetries(() => syncBillToServer(), SAVE_MAX_RETRIES, SAVE_RETRY_DELAYS_MS);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : err.message || 'Could not save after several attempts. Please try again.';
      onSaveFailedRef.current?.(msg);
      throw err;
    }
  }, [syncBillToServer]);

  /** Debounced auto-save when dirty and splits are valid. */
  useEffect(() => {
    if (!bill || !hasUnsavedChanges || hasInvalidItems || isSavingShares) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void saveShares().catch(() => {
        /* error surfaced via onSaveFailed + hook error state */
      });
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
  }, [bill, hasUnsavedChanges, hasInvalidItems, isSavingShares, saveShares]);

  const uploadReceipt = async (file: File) => {
    const targetBillId = bill?.id || initialBillId;

    if (!targetBillId) {
      console.log('DEBUG: uploadReceipt hook called but `billId` is missing');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const updatedBill = await billsService.uploadReceipt(targetBillId, file);

      setBill(updatedBill);

      return updatedBill.items;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload receipt');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShare = (itemId: number, userId: number, shareCount: number) => {
    setBill((prev) => {
      if (!prev) return null;

      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const filteredShares = item.shares.filter((s) => s.user_id !== userId);
          const newShare = {
            id: Date.now(),
            item_id: itemId,
            user_id: userId,
            share_count: shareCount,
          };
          return {
            ...item,
            shares: [...filteredShares, newShare],
          };
        }
        return item;
      });

      return { ...prev, items: updatedItems };
    });
    setHasUnsavedChanges(true);
  };

  const splitAllEqually = (userIds: number[]) => {
    setBill((prev) => {
      if (!prev) return null;

      const updatedItems = prev.items.map((item) => {
        const newShares = userIds.map((userId, index) => ({
          id: Date.now() + item.id + index,
          item_id: item.id,
          user_id: userId,
          share_count: 1,
        }));
        return {
          ...item,
          shares: newShares,
        };
      });

      return { ...prev, items: updatedItems };
    });
    setHasUnsavedChanges(true);
  };

  const resetAllShares = () => {
    setBill((prev) => {
      if (!prev) return null;

      const updatedItems = prev.items.map((item) => ({
        ...item,
        shares: [],
      }));

      return { ...prev, items: updatedItems };
    });
    setHasUnsavedChanges(true);
  };

  const updateItemDetails = (itemId: number, name: string, cost: number) => {
    setBill((prev) => {
      if (!prev) return null;
      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          return { ...item, item_name: name, unit_cost: cost };
        }
        return item;
      });
      return { ...prev, items: updatedItems };
    });

    if (itemId > 0) {
      setModifiedItems((prev) => ({
        ...prev,
        [itemId]: { item_name: name, unit_cost: cost },
      }));
    }
    setHasUnsavedChanges(true);
  };

  const updateTax = (tax: number) => {
    setBill((prev) => (prev ? { ...prev, total_tax: tax } : null));
    setModifiedTax(tax);
    setHasUnsavedChanges(true);
  };

  const bulkAddItems = useCallback((items: { item_name: string; unit_cost: number }[]) => {
    if (items.length === 0) return;
    setBill((prev) => {
      if (!prev) return null;
      const additions = items.map((it) => ({
        id: nextTempItemId(),
        bill_id: prev.id,
        item_name: it.item_name,
        unit_cost: it.unit_cost,
        shares: [] as ItemShare[],
      }));
      return { ...prev, items: [...prev.items, ...additions] };
    });
    setHasUnsavedChanges(true);
  }, []);

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

  const updateBillDetails = async (name: string | null, date: string) => {
    if (!bill) return;
    try {
      const updatedBill = await billsService.updateBill(bill.id, { name, date });
      setBill((prev) => (prev ? { ...prev, name: updatedBill.name, date: updatedBill.date } : null));
      return updatedBill;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update bill details');
      throw err;
    }
  };

  const addItem = async (itemName: string, unitCost: number) => {
    bulkAddItems([{ item_name: itemName, unit_cost: unitCost }]);
  };

  const deleteItem = async (itemId: number) => {
    if (itemId < 0) {
      setBill((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((item) => item.id !== itemId),
            }
          : null
      );
      setHasUnsavedChanges(true);
      return;
    }
    if (!bill) return;
    try {
      await billsService.deleteItem(itemId);
      setBill((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((item) => item.id !== itemId),
            }
          : null
      );
      setModifiedItems((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
      await fetchBill(bill.id);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete item');
      throw err;
    }
  };

  return {
    bill,
    isLoading,
    error,
    hasUnsavedChanges,
    hasInvalidItems,
    isSavingShares,
    fetchBill,
    uploadReceipt,
    updateShare,
    splitAllEqually,
    updateItemDetails,
    updateTax,
    addItem,
    bulkAddItems,
    deleteItem,
    saveShares,
    deleteBill,
    updateBillDetails,
    setBill,
    resetAllShares,
  };
}
