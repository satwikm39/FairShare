import { api } from './api';
import { isDemoMode } from '../config/demo';
import type { User } from '../types';
import { DEMO_USER } from './mock/db';

export const userService = {
  updateProfile: async (data: Partial<User>): Promise<User> => {
    if (isDemoMode()) {
      // Simulate success without a network request
      console.log('Demo mode active: Mocking profile update', data);
      return { ...DEMO_USER, ...data } as User;
    }
    
    const response = await api.patch<User>('/users/me', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    if (isDemoMode()) {
      return DEMO_USER as User;
    }
    
    const response = await api.get<User>('/users/me');
    return response.data;
  }
};
