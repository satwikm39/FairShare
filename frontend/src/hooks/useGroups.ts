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

  const createGroup = async (name: string, currency: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const newGroup = await groupsService.createGroup(name, currency);
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create group');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGroupLocally = async (groupId: number) => {
    try {
      await groupsService.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to delete group');
      throw err;
    }
  };

  const updateGroup = async (groupId: number, name?: string, currency?: string) => {
    try {
      const updatedGroup = await groupsService.updateGroup(groupId, { name, currency });
      setGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
      return updatedGroup;
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update group');
      throw err;
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
    createGroup,
    deleteGroup: deleteGroupLocally,
    updateGroup
  };
}
