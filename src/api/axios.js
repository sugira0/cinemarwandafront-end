import axios from 'axios';
import { API_BASE_URL } from '../lib/config';
import { firebaseAuth } from '../lib/firebase';

const API_TIMEOUT_MS = 15000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
});

api.interceptors.request.use(async config => {
  config.headers = config.headers || {};
  config.headers.Accept = config.headers.Accept || 'application/json';

  const token = firebaseAuth?.currentUser
    ? await firebaseAuth.currentUser.getIdToken()
    : localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  const deviceId = localStorage.getItem('deviceId');
  if (deviceId) {
    config.params = { ...(config.params || {}), deviceId };
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.code === 'ECONNABORTED') {
      error.userMessage = 'The server took too long to respond. Please try again.';
    }

    return Promise.reject(error);
  },
);

export default api;
