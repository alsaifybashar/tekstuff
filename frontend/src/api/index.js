import { httpGet } from "../lib/http";

// Map backend product → UI product (KEEP old prop names)
function normalizeProduct(p) {
  if (!p) return null;

  // Try multiple common keys so backend can evolve without breaking UI
  const image =
    p.image ?? p.imageUrl ?? p.images?.[0] ?? "/images/placeholder.png";

  const price =
    typeof p.price === "number" ? p.price :
    typeof p.currentPrice === "number" ? p.currentPrice :
    Number(p.price) || 0;

  const oldPrice =
    typeof p.oldPrice === "number" ? p.oldPrice :
    typeof p.listPrice === "number" ? p.listPrice :
    (p.oldPrice != null ? Number(p.oldPrice) : undefined);

  const inStock =
    typeof p.inStock === "number" ? p.inStock :
    typeof p.stock === "number" ? p.stock :
    (p.inStock === true ? 1 : 0);

  return {
    id: String(p.id ?? p.sku ?? p.slug ?? ""),
    slug: String(p.slug ?? p.id ?? ""),
    title: p.title ?? p.name ?? "Produkt",
    brand: p.brand ?? "",
    image,
    price,
    oldPrice,
    inStock,
    category: p.category ?? p.categorySlug ?? "",
    // keep any other fields you used before:
    // description: p.description ?? "",
    // images: p.images ?? (p.image ? [p.image] : []),
    // rating: p.rating ?? 0,
  };
}

function normalizeCategory(c) {
  if (!c) return null;
  return {
    id: String(c.id ?? c.slug ?? ""),
    slug: String(c.slug ?? c.id ?? ""),
    name: c.name ?? c.title ?? "",
    count:
      typeof c.count === "number" ? c.count :
      typeof c.total === "number" ? c.total : 0,
  };
}

export async function getProducts(params = {}) {
  const { data, status, fromCache } = await httpGet("/v1/products", { query: params });
  if (status === 304 && fromCache) return [];
  const arr = Array.isArray(data) ? data : [];
  return arr.map(normalizeProduct).filter(Boolean);
}

export async function getProductBySlug(slug) {
  const { data, status, fromCache } = await httpGet(`/v1/products/${slug}`);
  if (status === 304 && fromCache) throw new Error("Not Modified");
  return normalizeProduct(data);
}

export async function getCategories() {
  const { data, status, fromCache } = await httpGet("/v1/categories");
  if (status === 304 && fromCache) return [];
  const arr = Array.isArray(data) ? data : [];
  return arr.map(normalizeCategory).filter(Boolean);
}
