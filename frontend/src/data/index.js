import { products } from "../data/products";

// Simple, fast in-memory selectors.
// If you later switch to a backend, keep these function names and move logic to API calls.
export function getAllProducts() {
  return products;
}

export function getProductsByCategory(category) {
  if (!category) return products;
  const key = String(category).toLowerCase();
  return products.filter(p => String(p.category).toLowerCase() === key);
}

export function getProductBySlug(slug) {
  const key = String(slug).toLowerCase();
  return products.find(p => String(p.slug).toLowerCase() === key);
}

export function searchProducts(query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return products;
  return products.filter(p =>
    [p.title, p.brand, p.category, ...(p.tags || [])]
      .filter(Boolean)
      .some(val => String(val).toLowerCase().includes(q))
  );
}
