import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import vendureClient from '../lib/vendure/client';
import { GET_PRODUCTS, GET_PRODUCT, GET_COLLECTIONS, GET_ACTIVE_ORDER } from '../lib/vendure/queries';
import { ADD_TO_CART, ADJUST_ORDER_LINE, REMOVE_FROM_CART } from '../lib/vendure/mutations';

// Hook to fetch all products
export const useProducts = (options?: any) => {
  return useQuery({
    queryKey: ['products', options],
    queryFn: async () => {
      const data: any = await vendureClient.request(GET_PRODUCTS, { options });
      return data.products;
    },
  });
};

// Hook to fetch single product
export const useProduct = (slug?: string, id?: string) => {
  return useQuery({
    queryKey: ['product', slug, id],
    queryFn: async () => {
      const data: any = await vendureClient.request(GET_PRODUCT, { slug, id });
      return data.product;
    },
    enabled: !!(slug || id),
  });
};

// Hook to fetch collections (categories)
export const useCollections = (options?: any) => {
  return useQuery({
    queryKey: ['collections', options],
    queryFn: async () => {
      const data: any = await vendureClient.request(GET_COLLECTIONS, { options });
      return data.collections;
    },
  });
};

// Hook for cart operations
export const useCart = () => {
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['activeOrder'],
    queryFn: async () => {
      const data: any = await vendureClient.request(GET_ACTIVE_ORDER);
      return data.activeOrder;
    },
  });

  const addToCart = useMutation({
    mutationFn: async ({ productVariantId, quantity }: { productVariantId: string; quantity: number }) => {
      const data: any = await vendureClient.request(ADD_TO_CART, {
        productVariantId,
        quantity,
      });
      return data.addItemToOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrder'] });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ orderLineId, quantity }: { orderLineId: string; quantity: number }) => {
      const data: any = await vendureClient.request(ADJUST_ORDER_LINE, {
        orderLineId,
        quantity,
      });
      return data.adjustOrderLine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrder'] });
    },
  });

  const removeFromCart = useMutation({
    mutationFn: async (orderLineId: string) => {
      const data: any = await vendureClient.request(REMOVE_FROM_CART, { orderLineId });
      return data.removeOrderLine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeOrder'] });
    },
  });

  return {
    cart,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
  };
};
