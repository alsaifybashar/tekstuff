// Map backend product -> UI product (keep UI prop names unchanged)
export function adaptProduct(p) {
  if (!p) return null;
  return {
    id: p.id ?? p._id,
    slug: p.slug ?? p.handle,
    name: p.name ?? p.title,
    description: p.description ?? "",
    price: Number(p.price?.amount ?? p.price ?? 0),     // avoid NaN
    currency: p.price?.currency ?? "SEK",
    // ensure an array of image URLs
    images: Array.isArray(p.images)
      ? p.images.map(img => (typeof img === "string" ? img : img.url)).filter(Boolean)
      : p.image ? [p.image] : [],
    inStock: p.inStock ?? p.stock > 0 ?? true,
    rating: p.rating ?? 0,
    brand: p.brand ?? "",
    category: p.category?.slug ?? p.category ?? "",
    // add any other props your UI expects
  };
}

export function adaptProductList(list = []) {
  return list.map(adaptProduct).filter(Boolean);
}

export function adaptCategory(c) {
  return {
    slug: c.slug ?? c.id ?? "",
    name: c.name ?? c.title ?? "",
    count: c.count ?? c.productCount ?? 0
  };
}
