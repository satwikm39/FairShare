import axios from 'axios';

// Ensure this matches the FastAPI server port and host
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Firebase JWT token if available
api.interceptors.request.use(async (config) => {
  try {
    const { auth } = await import('../config/firebase');
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Failed to attach Firebase token', err);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Optionally add interceptors here for auth tokens or global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // We can add toast notifications here later
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
