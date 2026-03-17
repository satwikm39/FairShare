import { useState, useCallback, useEffect } from 'react';
import { groupsService } from '../services/groups';
import type { GroupBalances } from '../types';

export function useGroupBalances(groupId: number | null) {
  const [balances, setBalances] = useState<GroupBalances | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await groupsService.getGroupBalances(groupId);
      setBalances(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch balances');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return { balances, isLoading, error, refetch: fetchBalances };
}
