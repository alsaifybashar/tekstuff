import React from 'react';
import { useProducts, useCollections, useCart } from '../hooks/useVendure';

function TestVendure() {
  const { data: products, isLoading: productsLoading } = useProducts({ take: 5 });
  const { data: collections } = useCollections();
  const { cart, addToCart } = useCart();

  if (productsLoading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Vendure Integration Test</h1>
      
      <h2>Products ({products?.totalItems})</h2>
      {products?.items.map((product: any) => (
        <div key={product.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0' }}>
          <h3>{product.name}</h3>
          <p>{product.description}</p>
          <button onClick={() => addToCart.mutate({ productVariantId: product.variants[0].id, quantity: 1 })}>
            Add to Cart
          </button>
        </div>
      ))}

      <h2>Cart Items: {cart?.totalQuantity || 0}</h2>
      <pre>{JSON.stringify(cart, null, 2)}</pre>
    </div>
  );
}

export default TestVendure;
