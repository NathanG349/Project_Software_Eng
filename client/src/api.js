import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Ton URL Backend
});

// INTERCEPTEUR : Ajoute le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // On ajoute le header que notre "Vigile" backend attend
    config.headers['x-auth-token'] = token;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;