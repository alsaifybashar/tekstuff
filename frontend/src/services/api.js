const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const api = {
  listProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? `?${qs}` : ""}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  getProductBySlug: (slug) => request(`/products/slug/${slug}`),   // ✅ new
  listCategories: () => request(`/categories`),
};

