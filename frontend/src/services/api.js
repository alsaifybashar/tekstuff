// src/services/api.js
import { http } from "../lib/http";

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
