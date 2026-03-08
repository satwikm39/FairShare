import { useState, useCallback, useEffect } from 'react';
import { groupsService } from '../services/groups';
import type { Group } from '../types';

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await groupsService.getGroups();
      setGroups(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGroup = async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newGroup = await groupsService.createGroup(name);
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create group');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Initially fetch groups when hook mounts
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    isLoading,
    error,
    fetchGroups,
    createGroup
  };
}
