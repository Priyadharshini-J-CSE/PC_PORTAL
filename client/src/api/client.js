import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Redirect to home on session expiry
      if (window.location.pathname !== '/') window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
