import { api } from './api';

export interface BugReport {
  id: number;
  description: string;
  metadata_json: any;
  screenshot_base64?: string;
  status: string;
  created_at: string;
  user_id?: number;
}

export const bugsService = {
  getBugs: async (skip = 0, limit = 100): Promise<BugReport[]> => {
    const response = await api.get(`/bug-reports/`, {
      params: { skip, limit }
    });
    return response.data;
  },
  
  // Potential future methods
  updateStatus: async (id: number, status: string): Promise<BugReport> => {
    const response = await api.patch(`/bug-reports/${id}`, { status });
    return response.data;
  }
};
