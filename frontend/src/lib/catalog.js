// build facets from a product list (for counts/filters UI)
export function buildFacets(products) {
  const price = { min: Infinity, max: -Infinity };
  const brands = new Map();
  const attrs = { type: new Map(), connector: new Map(), cableLength: new Map() };

  products.forEach(p => {
    price.min = Math.min(price.min, p.price);
    price.max = Math.max(price.max, p.price);
    brands.set(p.brand, (brands.get(p.brand) || 0) + 1);
    Object.entries(attrs).forEach(([k, map]) => {
      const v = p.attrs?.[k];
      if (!v) return;
      map.set(v, (map.get(v) || 0) + 1);
    });
  });

  const toArr = (m) => [...m.entries()].map(([value, count]) => ({ value, count }));

  return {
    price,
    brands: toArr(brands),
    attrs: {
      type: toArr(attrs.type),
      connector: toArr(attrs.connector),
      cableLength: toArr(attrs.cableLength)
    }
  };
}

export function applyFilters({ products, filters }) {
  let list = [...products];
  const { price, brands, attrs, rating, inStock, deals, sort } = filters;

  if (price) list = list.filter(p => p.price >= price[0] && p.price <= price[1]);
  if (brands?.length) {
    const set = new Set(brands);
    list = list.filter(p => set.has(p.brand));
  }
  if (attrs) {
    for (const [k, values] of Object.entries(attrs)) {
      if (values?.length) {
        const set = new Set(values);
        list = list.filter(p => set.has(p.attrs?.[k]));
      }
    }
  }
  if (rating) list = list.filter(p => Math.floor(p.rating || 0) >= rating);
  if (inStock) list = list.filter(p => p.inStock);
  if (deals) list = list.filter(p => p.isDeal);

  switch (sort) {
    case "price_asc":  list.sort((a, b) => a.price - b.price); break;
    case "price_desc": list.sort((a, b) => b.price - a.price); break;
    case "rating_desc":list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
    default: break; // "popularity" placeholder
  }

  return list;
}
