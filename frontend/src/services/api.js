// src/services/api.js
import { http } from "../lib/http";
import axios from 'axios';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';


const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});


// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          localStorage.setItem('authToken', accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API service methods
export const productAPI = {
  // Get all products with filters
  getAll: (params = {}) => apiClient.get('/products', { params }),
  
  // Get single product by ID or slug
  getById: (id) => apiClient.get(`/products/${id}`),
  
  // Search products
  search: (params) => apiClient.get('/search/products', { params }),
  
  // Get search suggestions
  getSuggestions: (query) => apiClient.get('/search/suggestions', { 
    params: { q: query } 
  }),

  // Create product (admin)
  create: (data) => apiClient.post('/products', data),
  
  // Update product (admin)
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  
  // Delete product (admin)  
  delete: (id) => apiClient.delete(`/products/${id}`)
};

export const categoryAPI = {
  getAll: () => apiClient.get('/categories'),
  getById: (id) => apiClient.get(`/categories/${id}`),
  create: (data) => apiClient.post('/categories', data),
  update: (id, data) => apiClient.put(`/categories/${id}`, data),
  delete: (id) => apiClient.delete(`/categories/${id}`)
};

export const cartAPI = {
  get: () => apiClient.get('/cart'),
  add: (productId, quantity = 1) => apiClient.post('/cart/add', { productId, quantity }),
  update: (itemId, quantity) => apiClient.put(`/cart/${itemId}`, { quantity }),
  remove: (itemId) => apiClient.delete(`/cart/${itemId}`),
  clear: () => apiClient.delete('/cart')
};

export const orderAPI = {
  getAll: (params = {}) => apiClient.get('/orders', { params }),
  getById: (id) => apiClient.get(`/orders/${id}`),
  create: (data) => apiClient.post('/orders', data),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status })
};

export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/me'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.post('/auth/change-password', data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (data) => apiClient.post('/auth/reset-password', data),
  verifyEmail: (token) => apiClient.post('/auth/verify-email', { token }),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken })
};

// Helper functions for your existing frontend
export const getProducts = async (params = {}) => {
  try {
    const response = await productAPI.getAll(params);
    return response.data.data.products;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProductBySlug = async (slug) => {
  try {
    const response = await productAPI.getById(slug);
    return response.data.data.product;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const response = await categoryAPI.getAll();
    return response.data.data.categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

export const searchProducts = async (searchQuery, filters = {}) => {
  try {
    const response = await productAPI.search({ q: searchQuery, ...filters });
    return response.data.data;
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Export the axios instance for direct use
export { apiClient };
export default {
  productAPI,
  categoryAPI,
  cartAPI,
  orderAPI,
  authAPI
};


const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v == null || v === "") return;
    if (Array.isArray(v)) v.forEach((x) => p.append(k, String(x))); else p.set(k, String(v));
  });
  const s = p.toString(); return s ? `?${s}` : "";
};

const normalizeProduct = (p = {}) => {
  const out = { ...p };
  out.price = Number(out.price) || 0;
  if (out.oldPrice != null) out.oldPrice = Number(out.oldPrice);
  return out;
};

export const api = {
  async listProducts(params = {}) {
    const data = await http(`/v1/products${qs(params)}`);
    const items = Array.isArray(data?.items) ? data.items.map(normalizeProduct) : [];
    return {
      items,
      total: Number(data?.total) || items.length,
      offset: Number(data?.offset) || 0,
      limit: Number(data?.limit) || items.length,
      hasMore: Boolean(data?.hasMore),
    };
  },
  async getProductById(id) {
    const data = await http(`/v1/products/${encodeURIComponent(id)}`);
    return normalizeProduct(data);
  },
  async getProductBySlug(slug) {
    const data = await http(`/v1/products/slug/${encodeURIComponent(slug)}`);
    return normalizeProduct(data);
  },
  async getProductsBatch(ids = []) {
    const data = await http(`/v1/products/batch${qs({ ids })}`);
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  },
  async listCategories() {
    const data = await http(`/v1/categories`);
    return Array.isArray(data) ? data : [];
  },
};
