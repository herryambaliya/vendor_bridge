import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const apiAxios = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token from localStorage
apiAxios.interceptors.request.use(
  (config) => {
    const authStore = localStorage.getItem('auth-storage');
    if (authStore) {
      try {
        const parsed = JSON.parse(authStore);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error('Error parsing auth-storage token', err);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
