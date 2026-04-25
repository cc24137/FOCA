import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000"
});

// interceptor -> runs before every request is sent
api.interceptors.request.use(async config => {
  // gets token from localStorage
  const token = localStorage.getItem('@FOCA:token');
  
  if (token) {
    // adds token to Authorization header if it exists
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;