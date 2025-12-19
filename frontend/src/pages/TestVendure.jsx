import React from 'react';
import { useProducts, useCollections, useCart } from '../hooks/useVendure';

function TestVendure() {
  const { data: products, isLoading: productsLoading, error } = useProducts({ take: 5 });
  const { data: collections } = useCollections({ take: 5 });
  const { cart, addToCart } = useCart();

  if (productsLoading) return <div style={{ padding: '20px' }}>Loading products...</div>;
  if (error) return <div style={{ padding: '20px' }}>Error: {error.message}</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🎉 Vendure Integration Test</h1>
      
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>✅ Connection Status</h2>
        <p>Total Products: <strong>{products?.totalItems || 0}</strong></p>
        <p>Total Collections: <strong>{collections?.totalItems || 0}</strong></p>
        <p>Cart Items: <strong>{cart?.totalQuantity || 0}</strong></p>
      </div>

      <h2>📦 Products</h2>
      {products?.items.length === 0 ? (
        <p>No products found. Please add products in Vendure admin.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {products?.items.map((product) => (
            <div key={product.id} style={{ 
              border: '1px solid #ddd', 
              padding: '15px', 
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {product.featuredAsset && (
                <img 
                  src={product.featuredAsset.preview} 
                  alt={product.name}
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                />
              )}
              <h3>{product.name}</h3>
              <p style={{ color: '#666', fontSize: '14px' }}>{product.description}</p>
              {product.variants && product.variants[0] && (
                <>
                  <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb' }}>
                    {(product.variants[0].priceWithTax / 100).toFixed(2)} SEK
                  </p>
                  <button 
                    onClick={() => addToCart.mutate({ 
                      productVariantId: product.variants[0].id, 
                      quantity: 1 
                    })}
                    disabled={addToCart.isPending}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    {addToCart.isPending ? 'Adding...' : 'Add to Cart'}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: '40px' }}>🏷️ Collections</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
        {collections?.items.map((collection) => (
          <div key={collection.id} style={{ 
            border: '1px solid #ddd', 
            padding: '10px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {collection.featuredAsset && (
              <img 
                src={collection.featuredAsset.preview} 
                alt={collection.name}
                style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px' }}
              />
            )}
            <h4>{collection.name}</h4>
          </div>
        ))}
      </div>

      {cart && cart.lines && cart.lines.length > 0 && (
        <>
          <h2 style={{ marginTop: '40px' }}>🛒 Current Cart</h2>
          <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
            {cart.lines.map((line) => (
              <div key={line.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '10px',
                borderBottom: '1px solid #ddd'
              }}>
                <span>{line.productVariant.name} (x{line.quantity})</span>
                <span>{(line.linePriceWithTax / 100).toFixed(2)} SEK</span>
              </div>
            ))}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '10px',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              <span>Total:</span>
              <span>{(cart.totalWithTax / 100).toFixed(2)} SEK</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TestVendure;
