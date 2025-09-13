import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../ProductCard/ProductCard';
import { useCart } from '../../../context/CartContext';
import './ProductCarousel.css';

const ProductCarousel = ({
  title,
  products = [],
  featured = false,
  onAddToCart,   // optional
  className = ''
}) => {
  const scrollRef = useRef(null);
  const cart = useCart();
  const navigate = useNavigate();

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    
    const scrollLeft = el.scrollLeft;
    const scrollWidth = el.scrollWidth;
    const clientWidth = el.clientWidth;
    
    setCanLeft(scrollLeft > 5); // Small threshold for better UX
    setCanRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Initial check
    updateButtons();
    
    const onScroll = () => updateButtons();
    const onResize = () => updateButtons();
    
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [products.length]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    
    const cardWidth = 280; // Average card width
    const visibleCards = Math.floor(el.clientWidth / cardWidth);
    const scrollAmount = cardWidth * Math.max(1, visibleCards - 1);
    
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // Handle product click to navigate to product page
  const handleProductClick = (product, event) => {
    // Don't navigate if the click target is a button or inside a button
    if (event.target.closest('button') || event.target.closest('.btn')) {
      return;
    }
    
    if (product.slug) {
      navigate(`/p/${product.slug}`);
    } else if (product.id) {
      navigate(`/p/${product.id}`);
    }
  };

  // Handle add to cart - this function will be passed to ProductCard
  const handleAddToCart = (product) => {
    if (onAddToCart) {
      onAddToCart(product);
    } else if (cart.add) {
      cart.add(product.id, 1);
      console.log('Added to cart:', product.id);
    } else {
      console.warn("No add to cart function available");
    }
  };

  if (!products.length) return null;

  return (
    <section className={`product-carousel ${className}`}>
      {/* Header */}
      <div className="product-carousel-header">
        <h2 className="product-carousel-title">{title}</h2>
      </div>

      {/* Carousel Container */}
      <div className="pc-wrap">
        {/* Desktop Navigation Arrows */}
        <button
          type="button"
          className="pc-end-arrow pc-end-arrow-left"
          onClick={() => scroll('left')}
          disabled={!canLeft}
          aria-label="Föregående produkter"
          style={{ display: canLeft ? 'flex' : 'none' }}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Scrollable Track */}
        <div 
          ref={scrollRef} 
          className="pc-track" 
          role="list" 
          aria-label={`${title} produkter`}
        >
          {products.map((product, index) => (
            <div 
              key={product?.id || index} 
              className="pc-slide" 
              role="listitem"
            >
              <div 
                className="product-card-clickable"
                onClick={(e) => handleProductClick(product, e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleProductClick(product, e);
                  }
                }}
                aria-label={`Visa ${product.title || product.name}`}
              >
                <ProductCard
                  product={product}
                  featured={featured}
                  onAddToCart={handleAddToCart}
                  className="card-like"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right Navigation Arrow */}
        <button
          type="button"
          className="pc-end-arrow pc-end-arrow-right"
          onClick={() => scroll('right')}
          disabled={!canRight}
          aria-label="Nästa produkter"
          style={{ display: canRight ? 'flex' : 'none' }}
        >
          <ChevronRight size={20} />
        </button>

        {/* Mobile Touch Navigation */}
        <div className="pc-mobile-arrows d-flex d-md-none" aria-hidden="true">
          <button 
            type="button" 
            className="pc-mobile-btn" 
            onClick={() => scroll('left')} 
            disabled={!canLeft}
            aria-label="Föregående"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            type="button" 
            className="pc-mobile-btn" 
            onClick={() => scroll('right')} 
            disabled={!canRight}
            aria-label="Nästa"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;