// turn URLSearchParams -> state
export const parseParams = (sp) => {
  const j = (key, fallback) => {
    try { return JSON.parse(sp.get(key) || "") } catch { return fallback }
  };
  return {
    price: j("price"),
    brands: j("brands", []),
    attrs: j("attrs", {}),
    rating: sp.get("rating") ? +sp.get("rating") : undefined,
    inStock: sp.get("inStock") === "1" ? true : undefined,
    deals: sp.get("deals") === "1" ? true : undefined,
    sort: sp.get("sort") || "popularity",
    page: +(sp.get("page") || 1),
    pageSize: +(sp.get("pageSize") || 24),
    show: sp.get("show") === "1" ? true : undefined, // mobile offcanvas
  };
};

// state -> URLSearchParams
export const toParams = (state) => {
  const sp = new URLSearchParams();
  const setJson = (k, v) => v && sp.set(k, JSON.stringify(v));
  const setBool = (k, v) => v && sp.set(k, "1");
  const setVal  = (k, v, def) => v && v !== def && sp.set(k, String(v));

  setJson("price", state.price);
  setJson("brands", state.brands?.length ? state.brands : undefined);
  setJson("attrs", state.attrs && Object.keys(state.attrs).length ? state.attrs : undefined);
  setVal("rating", state.rating);
  setBool("inStock", state.inStock);
  setBool("deals", state.deals);
  setVal("sort", state.sort, "popularity");
  setVal("page", state.page, 1);
  setVal("pageSize", state.pageSize, 24);
  if (state.show) sp.set("show", "1");
  return sp;
};

// in-memory filter/sort/paginate (do it on server in real life)
export const applyFiltersAndSort = (products, s) => {
  let list = [...products];

  if (s.price) {
    const [lo, hi] = s.price;
    list = list.filter(p => p.price >= lo && p.price <= hi);
  }
  if (s.brands?.length) {
    const set = new Set(s.brands);
    list = list.filter(p => set.has(p.brand));
  }
  if (s.attrs) {
    for (const [k, values] of Object.entries(s.attrs)) {
      if (values?.length) {
        const set = new Set(values);
        list = list.filter(p => set.has(p.attrs?.[k]));
      }
    }
  }
  if (s.rating) list = list.filter(p => Math.floor(p.rating || 0) >= s.rating);
  if (s.inStock) list = list.filter(p => p.inStock);
  if (s.deals) list = list.filter(p => p.isDeal);

  switch (s.sort) {
    case "price_asc":  list.sort((a,b)=>a.price-b.price); break;
    case "price_desc": list.sort((a,b)=>b.price-a.price); break;
    case "newest":     list.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)); break;
    case "rating_desc":list.sort((a,b)=>(b.rating||0)-(a.rating||0)); break;
    default: /* popularity */ break;
  }

  const total = list.length;
  const start = (s.page - 1) * s.pageSize;
  const items = list.slice(start, start + s.pageSize);

  return { items, meta: { total } };
};
