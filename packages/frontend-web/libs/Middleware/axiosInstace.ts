import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { store } from '../Redux/store';
import { clearUserData, setAuthError } from '../Redux/userSlice';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
});

axiosRetry(axiosInstance, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return (
      axios.isAxiosError(error) &&
      (!error.response ||
        error.response.status === 429 ||
        error.response.status >= 500)
    );
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.user.userData?.access_token;
    if (token) {
      config.headers = config.headers || {};
      config.headers['access-token'] = token; // Use 'access-token' header instead of 'Authorization'
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status } = error.response;
      if (status === 401) {
        store.dispatch(setAuthError());
        console.error('Unauthorized or Not Found:', error.response.data?.message || 'Authentication failed, dispatching error action.');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;