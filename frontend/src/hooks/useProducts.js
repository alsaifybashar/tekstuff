// src/hooks/useProduct.js
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";
import { useState, useEffect, useCallback } from 'react';
import { productAPI } from '../services/api';


export function useProductBySlug(slug) {
  return useQuery({
    queryKey: ["product", "slug", slug],
    enabled: !!slug,
    queryFn: () => api.getProductBySlug(slug),
    staleTime: 30_000,
    retry: 2,
  });
}


export const useProducts = (initialFilters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState(initialFilters);

  const fetchProducts = useCallback(async (newFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const mergedFilters = { ...filters, ...newFilters };
      const response = await productAPI.getAll(mergedFilters);
      
      setProducts(response.data.data.products);
      setPagination(response.data.data.pagination);
      setFilters(mergedFilters);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  const updateFilters = useCallback((newFilters) => {
    fetchProducts(newFilters);
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (pagination.hasNext) {
      fetchProducts({ ...filters, page: pagination.page + 1 });
    }
  }, [fetchProducts, filters, pagination]);

  return {
    products,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    loadMore,
    refetch: () => fetchProducts(filters)
  };
};

export const useProduct = (slug) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await productAPI.getById(slug);
        setProduct(response.data.data.product);

      } catch (err) {
        setError(err.message);
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  return { product, loading, error };
};

export const useProductSearch = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query, filters = {}) => {
    if (!query?.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await productAPI.search({ q: query, ...filters });
      setResults(response.data.data);

    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
};