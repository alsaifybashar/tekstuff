import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getCategories, getProducts } from "../api"; // ⟵ relative import (no types)

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const lastProductsRef = useRef([]);
  const lastCategoriesRef = useRef([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [cats, prods] = await Promise.all([getCategories(), getProducts()]);
        if (!mounted) return;
        if (cats?.length) {
          setCategories(cats);
          lastCategoriesRef.current = cats;
        }
        if (prods?.length) {
          setProducts(prods);
          lastProductsRef.current = prods;
        }
        setError(null);
      } catch (e) {
        if (!mounted) return;
        if (!categories.length && lastCategoriesRef.current.length) {
          setCategories(lastCategoriesRef.current);
        }
        if (!products.length && lastProductsRef.current.length) {
          setProducts(lastProductsRef.current);
        }
        setError(e?.message || "Failed to load data.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async (opts = {}) => {
    try {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        categories.length ? Promise.resolve([]) : getCategories(),
        getProducts({ category: opts.category, q: opts.q }),
      ]);
      if (cats?.length) {
        setCategories(cats);
        lastCategoriesRef.current = cats;
      }
      if (prods?.length) {
        setProducts(prods);
        lastProductsRef.current = prods;
      }
      setError(null);
    } catch (e) {
      setError(e?.message || "Refresh failed.");
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(() => ({
    products: products.length ? products : lastProductsRef.current,
    categories: categories.length ? categories : lastCategoriesRef.current,
    loading,
    error,
    refresh,
  }), [products, categories, loading, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within <DataProvider>");
  return ctx;
}
