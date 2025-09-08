// src/hooks/useProduct.js
import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

export function useProductBySlug(slug) {
  return useQuery({
    queryKey: ["product", "slug", slug],
    enabled: !!slug,
    queryFn: () => api.getProductBySlug(slug),
    staleTime: 30_000,
    retry: 2,
  });
}
