import { api } from './api';
import type { Group, Bill } from '../types';

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
  createGroup: async (name: string): Promise<Group> => {
    const response = await api.post<Group>('/groups/', { name });
    return response.data;
  },

  /**
   * Add a user to a group
   */
  addMember: async (groupId: number, userId: number): Promise<void> => {
    await api.post(`/groups/${groupId}/members/?user_id=${userId}`);
  },

  /**
   * Fetch all bills for a specific group
   */
  getGroupBills: async (groupId: number): Promise<Bill[]> => {
    const response = await api.get<Bill[]>(`/groups/${groupId}/bills/`);
    return response.data;
  },

  /**
   * Create a new bill in a group
   */
  createBill: async (groupId: number): Promise<Bill> => {
    const response = await api.post<Bill>(`/groups/${groupId}/bills/`, {
      group_id: groupId,
      total_tax: 0,
      subtotal: 0,
      grand_total: 0
    });
    return response.data;
  }
};
