import axios from 'axios';
import { getAccessToken, getRefreshToken, setAccessToken, logout } from './utils/auth';

// In development we use the CRA proxy (avoids CORS).
// In production REACT_APP_API_URL must be set to the absolute backend URL.
const baseURL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Attach access token
api.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Response interceptor to handle 401 and try refresh
let isRefreshing = false;
let subscribers = [];

function onRefreshed(token) {
  subscribers.forEach(cb => cb(token));
  subscribers = [];
}

function addSubscriber(cb) {
  subscribers.push(cb);
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        logout();
        window.location.href = '/auth';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addSubscriber(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const resp = await axios.post(baseURL + '/auth/refresh/', { refresh: refreshToken });
        const newAccess = resp.data.access;
        setAccessToken(newAccess);
        // Ensure axios instance uses the new token immediately
        api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccess;
        onRefreshed(newAccess);
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccess;
        isRefreshing = false;
        return api(originalRequest);
      } catch (e) {
        isRefreshing = false;
        logout();
        window.location.href = '/auth';
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
