import { api } from './api';
import type { Group, Bill, GroupBalances } from '../types';
import { mockGroupsService } from './mock/groups';
import { isDemoMode } from '../config/demo';

export const groupsService = {
  /**
   * Fetch all groups
   */
  getGroups: async (): Promise<Group[]> => {
    if (isDemoMode()) return mockGroupsService.getGroups();
    const response = await api.get<Group[]>('/groups/');
    return response.data;
  },

  /**
   * Fetch a single group by ID
   */
  getGroup: async (groupId: number): Promise<Group> => {
    if (isDemoMode()) return mockGroupsService.getGroup(groupId);
    const response = await api.get<Group>(`/groups/${groupId}`);
    return response.data;
  },

  /**
   * Create a new group
   */
  createGroup: async (name: string, currency: string = '$'): Promise<Group> => {
    if (isDemoMode()) return mockGroupsService.createGroup(name, currency);
    const response = await api.post<Group>('/groups/', { name, currency });
    return response.data;
  },

  /**
   * Delete a group
   */
  deleteGroup: async (groupId: number): Promise<void> => {
    if (isDemoMode()) return mockGroupsService.deleteGroup(groupId);
    await api.delete(`/groups/${groupId}`);
  },

  /**
   * Update a group
   */
  updateGroup: async (groupId: number, data: { name?: string; currency?: string; simplify_debts?: boolean }): Promise<Group> => {
    if (isDemoMode()) return mockGroupsService.updateGroup(groupId, data);
    const response = await api.patch<Group>(`/groups/${groupId}`, data);
    return response.data;
  },

  /**
   * Create a new settlement between two users
   */
  createSettlement: async (groupId: number, data: { from_user_id: number; to_user_id: number; amount: number }): Promise<void> => {
    if (isDemoMode()) return mockGroupsService.createSettlement(groupId, data);
    await api.post(`/groups/${groupId}/settlements`, { ...data, group_id: groupId });
  },

  /**
   * Add a user to a group by email
   */
  addMemberByEmail: async (groupId: number, email: string): Promise<void> => {
    if (isDemoMode()) return mockGroupsService.addMemberByEmail(groupId, email);
    await api.post(`/groups/${groupId}/members/`, { email });
  },

  /**
   * Remove a member from a group
   */
  removeGroupMember: async (groupId: number, userId: number): Promise<void> => {
    if (isDemoMode()) return mockGroupsService.removeGroupMember(groupId, userId);
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },

  /**
   * Fetch all bills for a specific group
   */
  getGroupBills: async (groupId: number): Promise<Bill[]> => {
    if (isDemoMode()) return mockGroupsService.getGroupBills(groupId);
    const response = await api.get<Bill[]>(`/groups/${groupId}/bills/`);
    return response.data;
  },

  getGroupBalances: async (groupId: number): Promise<GroupBalances> => {
    if (isDemoMode()) return mockGroupsService.getGroupBalances(groupId);
    const response = await api.get<GroupBalances>(`/groups/${groupId}/balances`);
    return response.data;
  },

  /**
   * Create a new bill in a group
   */
  createBill: async (
    groupId: number,
    data?: { name: string; date: string; participant_user_ids: number[] }
  ): Promise<Bill> => {
    if (isDemoMode()) return mockGroupsService.createBill(groupId, data);
    
    const payload: Record<string, unknown> = {
      group_id: groupId,
      total_tax: 0,
      subtotal: 0,
      grand_total: 0,
    };

    if (data?.name) payload.name = data.name;
    if (data?.date) {
      payload.date = new Date(`${data.date}T00:00:00`).toISOString();
    }
    if (data?.participant_user_ids?.length) {
      payload.participant_user_ids = data.participant_user_ids;
    }

    const response = await api.post<Bill>(`/groups/${groupId}/bills/`, payload);
    return response.data;
  },
};
