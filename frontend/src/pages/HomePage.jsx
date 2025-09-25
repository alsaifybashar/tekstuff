import React from 'react';
import { useProducts } from '../hooks/useProducts';

// Your existing components
import Navbar from '../components/Navbar';
import Footer from '../components/Footer/Footer';
import CategoryStrip from '../components/CategoryStrip';
import Hero from '../components/Layout/Hero/Hero';
import ProductCarousel from '../components/Product/ProductCarousel/ProductCarousel';

import { useCart } from '../context/CartContext';
import './HomePage.css';

export default function HomePage() {
  const cart = useCart();
  
  // Use live backend data instead of allProducts import
  const { products: allProducts, loading } = useProducts({ limit: 20 });
  
  // Process products like before
  const featuredDeals = allProducts?.filter(p => p.oldPrice) || [];
  const popularProducts = allProducts?.filter(p => !p.oldPrice) || [];

  const handleAddToCart = (product) => {
    if (product && product.id && product.inStock) {
      if (cart.add) {
        cart.add(product.id, 1);
        console.log('Added to cart:', product.id);
      }
    }
  };

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      
      <main className="flex-grow-1">
        <div className="refined-homepage">
          <CategoryStrip onSelect={(id) => console.log("Selected:", id)} />

          <Hero
            title={
              <>
                Premium elektronik för
                <span className="hero-highlight"> moderna livet</span>
              </>
            }
            description="Upptäck vårt sortiment av laddare, kablar och tillbehör."
          />

          {/* Show deals if available */}
          {featuredDeals.length > 0 && (
            <section>
              <h2>Dagens deals</h2>
              <ProductCarousel 
                products={featuredDeals}
                onAddToCart={handleAddToCart}
              />
            </section>
          )}

          {/* Show popular products */}
          {popularProducts.length > 0 && (
            <section>
              <h2>Populära produkter</h2>
              <ProductCarousel 
                products={popularProducts}
                onAddToCart={handleAddToCart}
              />
            </section>
          )}
          
          {/* Show message if no products */}
          {allProducts.length === 0 && (
            <div className="text-center py-5">
              <h3>No products available</h3>
              <p>Backend is connected but no products found.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
