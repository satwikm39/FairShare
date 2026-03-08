import axios from 'axios';

// Ensure this matches the FastAPI server port and host
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
