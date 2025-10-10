/**
 * ---------------------------------------------------------
 * Project: ISAG AB
 * Developer Full Stack: Darwin Rengifo
 * Create Date: 2025-07-25
 * Design Name: axios.ts
 * Tools: React, React Router, TanStack Query
 * Description:
 * This file configures the Axios client for the ISAG AB project.
 * It sets up the base URL and interceptors for handling authentication tokens.
 * -----------------------------------------------------------
 */
import axios from 'axios';

// Creates an axios instance with your API base URL
export const apiClient = axios.create({
  baseURL: 'http://localhost:3001', // Backend-URL
});
/*export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});*/

// Interceptor: Automatically adds the JWT token to each outgoing request
apiClient.interceptors.request.use(
  (config) => {
    // This reads the MOST RECENT value from localStorage at the exact time of the request.
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);
