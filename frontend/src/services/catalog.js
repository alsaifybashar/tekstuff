// src/services/catalog.js
import products from "../data/products"; // <- your products.js default export (array)

// --- utils ---
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Normalize: ensure every product has a slug, keep original fields intact
export const PRODUCTS = (Array.isArray(products) ? products : []).map((p) => ({
  ...p,
  slug: p.slug || slugify(p.title || p.name || p.id),
}));

// Fast indexes
export const productIndex = new Map(PRODUCTS.map((p) => [p.id, p]));
export const slugIndex = new Map(PRODUCTS.map((p) => [p.slug, p]));

// ========== Queries ==========

// All products
export function getAllProducts() {
  return PRODUCTS;
}

// Category listing (default export to keep existing imports working)
export default function getProductsByCategory(categorySlug, limit) {
  const key = String(categorySlug || "").toLowerCase();
  const items = PRODUCTS.filter((p) => {
    if (p.category) return String(p.category).toLowerCase() === key;
    if (Array.isArray(p.categories))
      return p.categories.map((c) => String(c).toLowerCase()).includes(key);
    return false;
  });
  return typeof limit === "number" ? items.slice(0, limit) : items;
}

// One product by slug
export function getProductBySlug(slug) {
  return slugIndex.get(slug);
}

// One product by id
export function getProductById(id) {
  return productIndex.get(id);
}

// Related (same category; prefer same brand; exclude self)
export function getRelatedProducts(product, limit = 8) {
  if (!product) return [];
  const categoryKey = product.category ?? (Array.isArray(product.categories) ? product.categories[0] : null);

  const pool = categoryKey
    ? PRODUCTS.filter(
        (p) => p.id !== product.id && (p.category === categoryKey || p.categories?.includes(categoryKey))
      )
    : PRODUCTS.filter((p) => p.id !== product.id);

  const scored = pool
    .map((p) => ({ p, score: p.brand && product.brand && p.brand === product.brand ? 2 : 1 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);

  return scored.slice(0, limit);
}

// Deals
export function getDeals(limit) {
  const items = PRODUCTS.filter((p) => p.isDeal);
  return typeof limit === "number" ? items.slice(0, limit) : items;
}
