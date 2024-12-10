
import axios from "axios";
import { API_BASE_URL } from "./config"; // Importing API_BASE_URL dynamically
import { ACCESS_TOKEN } from "./constants"; // Importing ACCESS_TOKEN
const apiUrl = "http";

const api = axios.create({
  baseURL: API_BASE_URL, // Using the dynamic API_BASE_URL
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
