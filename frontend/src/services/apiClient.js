// Single source of truth for all HTTP calls
import axios from "axios";

// Read base URL from env (Vite) -> import.meta.env; CRA -> process.env
const baseURL = import.meta?.env?.VITE_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;

// Example: https://api.yourdomain.com or http://localhost:4000
export const api = axios.create({
  baseURL,
  timeout: 10000,          // be explicit
  withCredentials: true,   // if you use cookies/sessions; otherwise false
  headers: { "Content-Type": "application/json" }
});

// Request interceptor (attach auth tokens if you use them)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor (normalized errors, optional retries)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // unify error shape
    const msg = err?.response?.data?.message || err.message || "Network error";
    return Promise.reject(new Error(msg));
  }
);

// ---------- Resource helpers (call these from pages/components) ----------
export async function fetchProducts(params = {}) {
  const { data } = await api.get("/products", { params });
  return data;
}

export async function fetchProductById(id) {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

export async function fetchCategories() {
  const { data } = await api.get("/categories");
  return data;
}

// …add other endpoints here (cart, search, etc.)
