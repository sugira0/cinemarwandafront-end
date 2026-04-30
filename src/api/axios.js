import axios from 'axios';
import { API_BASE_URL } from '../lib/config';
import { firebaseAuth } from '../lib/firebase';

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use(async config => {
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

export default api;
