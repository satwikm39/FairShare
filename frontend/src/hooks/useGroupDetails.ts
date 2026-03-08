import { useState, useCallback, useEffect } from 'react';
import { groupsService } from '../services/groups';
import type { Group, Bill } from '../types';

export function useGroupDetails(groupId: number) {
  const [group, setGroup] = useState<Group | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!groupId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [groupData, billsData] = await Promise.all([
        groupsService.getGroup(groupId),
        groupsService.getGroupBills(groupId)
      ]);
      setGroup(groupData);
      setBills(billsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch group details');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    group,
    bills,
    isLoading,
    error,
    refresh: fetchData
  };
}
