import axios from 'axios';
import axiosRetry from 'axios-retry';
import { store } from '../Redux/store';
import { clearUserData } from '../Redux/userSlice';

// Create the Axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // Set a 10-second timeout
});

// Configure retry logic
axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000, // Exponential backoff
  retryCondition: (error) => {
    return (
      axios.isAxiosError(error) &&
      (!error.response || // No response (e.g., network error)
        error.response.status === 429 || // Rate limit
        error.response.status >= 500) // Server errors
    );
  },
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.user.userData?.access_token;

    if (token) {
      config.headers = config.headers || {};
      config.headers['access-token'] = token;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response;

      if (status === 401 || status === 404) {
        store.dispatch(clearUserData());
        localStorage.clear();

        if (typeof window !== 'undefined') {
          const locale = store.getState().user.userData?.locale || 'en';
          window.location.href = `/${locale}/login`;
        }

        console.error('Unauthorized or Not Found:', error.response.data?.message || 'Redirecting to login');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;