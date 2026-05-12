import axios from "axios";
import { tokenStorage } from "./storage.js";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const http = axios.create({
  baseURL,
  withCredentials: true
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  const url = config.url || "";
  const skipAuth = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh");
  if (token && !skipAuth) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
    }
    return Promise.reject(error);
  }
);
