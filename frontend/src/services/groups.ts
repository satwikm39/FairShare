import { api } from './api';
import type { Group, Bill, GroupBalances } from '../types';

export const groupsService = {
  /**
   * Fetch all groups
   */
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/groups/');
    return response.data;
  },

  /**
   * Fetch a single group by ID
   */
  getGroup: async (groupId: number): Promise<Group> => {
    const response = await api.get<Group>(`/groups/${groupId}`);
    return response.data;
  },

  /**
   * Create a new group
   */
  createGroup: async (name: string, currency: string = '$'): Promise<Group> => {
    const response = await api.post<Group>('/groups/', { name, currency });
    return response.data;
  },

  /**
   * Delete a group
   */
  deleteGroup: async (groupId: number): Promise<void> => {
    await api.delete(`/groups/${groupId}`);
  },

  /**
   * Update a group
   */
  updateGroup: async (groupId: number, data: { name?: string; currency?: string; simplify_debts?: boolean }): Promise<Group> => {
    const response = await api.patch<Group>(`/groups/${groupId}`, data);
    return response.data;
  },

  /**
   * Create a new settlement between two users
   */
  createSettlement: async (groupId: number, data: { from_user_id: number; to_user_id: number; amount: number }): Promise<void> => {
    await api.post(`/groups/${groupId}/settlements`, { ...data, group_id: groupId });
  },

  /**
   * Add a user to a group by email
   */
  addMemberByEmail: async (groupId: number, email: string): Promise<void> => {
    await api.post(`/groups/${groupId}/members/`, { email });
  },

  /**
   * Remove a member from a group
   */
  removeGroupMember: async (groupId: number, userId: number): Promise<void> => {
    await api.delete(`/groups/${groupId}/members/${userId}`);
  },

  /**
   * Fetch all bills for a specific group
   */
  getGroupBills: async (groupId: number): Promise<Bill[]> => {
    const response = await api.get<Bill[]>(`/groups/${groupId}/bills/`);
    return response.data;
  },

  getGroupBalances: async (groupId: number): Promise<GroupBalances> => {
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
