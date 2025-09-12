import React from 'react';
import { ShoppingCart } from 'lucide-react';

// Layout Components
import Navbar from '../components/Navbar';
import Footer from '../components/Footer/Footer';
import CategoryStrip from '../components/CategoryStrip';

// Reusable Components
import Hero from '../components/Layout/Hero/Hero';
import ProductCarousel from '../components/Product/ProductCarousel/ProductCarousel';
import Newsletter from '../components/Form/Newsletter/Newsletter';
import Section from '../components/Layout/Section/Section';

// Context and Data
import { useCart } from '../context/CartContext';
import allProducts from '../data/products.js';

import './HomePage.css';

export default function HomePage() {
  const { add } = useCart();

  // Process your existing products
  const featuredDeals = allProducts?.filter(p => p.isDeal || p.oldPrice) || [];
  const popularProducts = allProducts?.filter(p => !p.isDeal) || [];

  // Event handlers
  const handleAddToCart = (product) => {
    if (product.id && product.inStock) {
      add(product.id, 1);
    }
  };

  const handleWishlist = (product, isAdded) => {
    console.log('Wishlist:', product.id, isAdded);
  };

  const handleQuickView = (product) => {
    console.log('Quick view:', product.id);
  };

  const handleExploreProducts = () => {
    console.log('Navigate to products');
  };

  const handleViewOffers = () => {
    console.log('Navigate to offers');
  };

  const handleNewsletterSignup = (email) => {
    console.log('Newsletter signup:', email);
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      
      <main className="flex-grow-1">
        <div className="refined-homepage">
          {/* Category Strip */}
          <CategoryStrip onSelect={(id) => console.log("Selected:", id)} />

          {/* Hero Section */}
          <Hero
            title={
              <>
                Premium elektronik för
                <span className="hero-highlight"> moderna livet</span>
              </>
            }
            description="Upptäck vårt noggrant utvalda sortiment av laddare, kablar och tillbehör från världens mest förtrodda märken."
            primaryCTA={{
              text: "Utforska produkter",
              icon: <ShoppingCart size={18} />,
              onClick: handleExploreProducts
            }}
            secondaryCTA={{
              text: "Se erbjudanden",
              onClick: handleViewOffers
            }}
            image={{
              src: "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=600&h=400&fit=crop",
              alt: "Premium elektronik"
            }}
          />

      

          {/* Featured Deals */}
          {featuredDeals.length > 0 && (
            <Section>
              <ProductCarousel
                title="Super Deals"
                products={featuredDeals}
                featured={true}
                onAddToCart={handleAddToCart}
                onWishlist={handleWishlist}
                onQuickView={handleQuickView}
              />
            </Section>
          )}

          {/* Popular Products */}
          {popularProducts.length > 0 && (
            <Section>
              <ProductCarousel
                title="Populära produkter"
                products={popularProducts}
                onAddToCart={handleAddToCart}
                onWishlist={handleWishlist}
                onQuickView={handleQuickView}
              />
            </Section>
          )}

          {/* Newsletter */}
          <Newsletter
            title="Håll dig uppdaterad"
            description="Få de senaste erbjudandena och produktnyheterna direkt i din inkorg"
            onSignup={handleNewsletterSignup}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}