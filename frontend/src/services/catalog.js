// src/services/catalog.js
import productsArr from '../data/products';

// Tiny helper
const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const PRODUCTS = (Array.isArray(productsArr) ? productsArr : []).map((p) => ({
  ...p,
  slug: p.slug || slugify(p.title || p.name || p.id), // ← ensure slug
}));

export function getAllProducts() {
  return PRODUCTS;
}

export default function getProductsByCategory(categorySlug, limit) {
  const items = PRODUCTS.filter((p) => {
    if (p.category) return p.category.toLowerCase() === categorySlug?.toLowerCase();
    if (Array.isArray(p.categories))
      return p.categories.map((c) => String(c).toLowerCase()).includes(categorySlug?.toLowerCase());
    return false;
  });
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}

// New: fetch one product by slug
export function getProductBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug);
}

// New: simple related-products (same category, exclude self)
export function getRelatedProducts(product, limit = 8) {
  if (!product) return [];
  const categoryKey = product.category ?? (Array.isArray(product.categories) ? product.categories[0] : null);
  const pool = categoryKey
    ? PRODUCTS.filter((p) => p !== product && (p.category === categoryKey || p.categories?.includes(categoryKey)))
    : PRODUCTS.filter((p) => p !== product);

  // naive score: prefer same brand first
  const scored = pool
    .map((p) => ({ p, score: (p.brand && product.brand && p.brand === product.brand) ? 2 : 1 }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);

  return scored.slice(0, limit);
}

// Handy for homepage (kept)
export function getDeals(limit) {
  const items = PRODUCTS.filter((p) => p.isDeal);
  return typeof limit === 'number' ? items.slice(0, limit) : items;
}
