import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
let refreshInFlight = null;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Access and refresh tokens live only in HttpOnly cookies; JavaScript never reads them.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      originalRequest._retry = true;
      try {
        if (!refreshInFlight) {
          refreshInFlight = axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
            .finally(() => { refreshInFlight = null; });
        }
        await refreshInFlight;
        return api(originalRequest);
      } catch (refreshError) {
        if (typeof window !== 'undefined' && !['/login', '/register'].includes(window.location.pathname)) {
          window.location.assign('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
