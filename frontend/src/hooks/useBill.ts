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

  // Refs to snapshot state at save-start for optimistic merging.
  const billRef = useRef(bill);
  billRef.current = bill;
  const modifiedItemsRef = useRef(modifiedItems);
  modifiedItemsRef.current = modifiedItems;
  const modifiedTaxRef = useRef(modifiedTax);
  modifiedTaxRef.current = modifiedTax;

  /** Single API attempt - no retries. */
  const syncBillToServer = useCallback(async () => {
    if (!bill) return;

    // Snapshot the state we're about to send so we can diff against it later.
    const snapshotBill = bill;
    const snapshotModifiedItems = { ...modifiedItems };
    const snapshotModifiedTax = modifiedTax;

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

      // --- Optimistic merge: preserve edits made while save was in-flight ---
      const currentBill = billRef.current;
      const currentModifiedItems = modifiedItemsRef.current;
      const currentModifiedTax = modifiedTaxRef.current;

      // Build a map from temp_id → server-assigned id for items created in this save.
      const tempIdToServerId = new Map<number, number>();
      if (updated.items && snapshotBill.items) {
        for (const snapItem of snapshotBill.items) {
          if (snapItem.id < 0) {
            // Find matching server item by name + cost (server won't have the temp id)
            const match = updated.items.find(
              (si) => si.item_name === snapItem.item_name && si.unit_cost === snapItem.unit_cost && si.id > 0
            );
            if (match) tempIdToServerId.set(snapItem.id, match.id);
          }
        }
      }

      // Detect whether the user made any changes while the save was in-flight
      // by comparing current refs against the snapshot we sent.
      let hasInflightEdits = false;

      // Check for in-flight item detail edits (new keys or changed values vs snapshot)
      const inflightItemEdits: Record<number, { item_name?: string; unit_cost?: number }> = {};
      for (const [idStr, data] of Object.entries(currentModifiedItems)) {
        const id = Number(idStr);
        const snapData = snapshotModifiedItems[id];
        if (!snapData || snapData.item_name !== data.item_name || snapData.unit_cost !== data.unit_cost) {
          inflightItemEdits[id] = data;
          hasInflightEdits = true;
        }
      }

      // Check for in-flight tax edits
      let inflightTax: number | null = null;
      if (currentModifiedTax !== null && currentModifiedTax !== snapshotModifiedTax) {
        inflightTax = currentModifiedTax;
        hasInflightEdits = true;
      }

      // Check for in-flight share edits by comparing current bill items against snapshot
      const inflightShareEdits = new Map<string, number>(); // "itemId:userId" → share_count
      if (currentBill && currentBill !== snapshotBill) {
        for (const currentItem of currentBill.items) {
          // Only compare items that existed in the snapshot (not newly added during flight)
          const snapItem = snapshotBill.items.find((si) => si.id === currentItem.id);
          if (!snapItem) {
            // Entirely new item added during save - mark as in-flight
            hasInflightEdits = true;
            continue;
          }
          for (const share of currentItem.shares) {
            const snapShare = snapItem.shares.find((ss) => ss.user_id === share.user_id);
            const snapCount = snapShare ? snapShare.share_count : 0;
            if (share.share_count !== snapCount) {
              inflightShareEdits.set(`${currentItem.id}:${share.user_id}`, share.share_count);
              hasInflightEdits = true;
            }
          }
          // Check for shares removed during flight
          for (const snapShare of snapItem.shares) {
            const currentShare = currentItem.shares.find((cs) => cs.user_id === snapShare.user_id);
            if (!currentShare || currentShare.share_count === 0) {
              const key = `${currentItem.id}:${snapShare.user_id}`;
              if (!inflightShareEdits.has(key) && snapShare.share_count > 0) {
                inflightShareEdits.set(key, 0);
                hasInflightEdits = true;
              }
            }
          }
        }
      }

      if (hasInflightEdits) {
        // Merge in-flight edits on top of the server response
        let merged = { ...updated };

        // Merge share edits
        if (inflightShareEdits.size > 0) {
          merged = {
            ...merged,
            items: merged.items.map((item) => {
              let itemShares = [...item.shares];
              let changed = false;
              for (const [key, count] of inflightShareEdits) {
                // Resolve temp IDs to server IDs
                const [rawItemId, userIdStr] = key.split(':');
                let itemId = Number(rawItemId);
                if (itemId < 0) {
                  itemId = tempIdToServerId.get(itemId) ?? itemId;
                }
                if (itemId !== item.id) continue;
                const userId = Number(userIdStr);
                changed = true;
                const existing = itemShares.findIndex((s) => s.user_id === userId);
                if (count === 0) {
                  if (existing >= 0) itemShares.splice(existing, 1);
                } else if (existing >= 0) {
                  itemShares[existing] = { ...itemShares[existing], share_count: count };
                } else {
                  itemShares.push({ id: Date.now(), item_id: item.id, user_id: userId, share_count: count });
                }
              }
              return changed ? { ...item, shares: itemShares } : item;
            }),
          };
        }

        // Merge item detail edits
        if (Object.keys(inflightItemEdits).length > 0) {
          merged = {
            ...merged,
            items: merged.items.map((item) => {
              const edit = inflightItemEdits[item.id];
              if (!edit) return item;
              return {
                ...item,
                ...(edit.item_name !== undefined ? { item_name: edit.item_name } : {}),
                ...(edit.unit_cost !== undefined ? { unit_cost: edit.unit_cost } : {}),
              };
            }),
          };
        }

        // Merge new items added during flight (items in current that weren't in snapshot)
        if (currentBill) {
          const newDuringFlight = currentBill.items.filter(
            (ci) => !snapshotBill.items.some((si) => si.id === ci.id)
          );
          if (newDuringFlight.length > 0) {
            merged = { ...merged, items: [...merged.items, ...newDuringFlight] };
          }
        }

        // Merge tax edit
        if (inflightTax !== null) {
          merged = { ...merged, total_tax: inflightTax };
        }

        setBill(merged);
        setModifiedItems(inflightItemEdits);
        setModifiedTax(inflightTax);
        setHasUnsavedChanges(true);
      } else {
        setBill(updated);
        setModifiedItems({});
        setModifiedTax(null);
        setHasUnsavedChanges(false);
      }
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
    if (!bill || !hasUnsavedChanges || isSavingShares) {
      return;
    }

    const timerId = window.setTimeout(() => {
      void saveShares().catch(() => {
        /* error surfaced via onSaveFailed + hook error state */
      });
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timerId);
  }, [bill, hasUnsavedChanges, isSavingShares, saveShares]);

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
