// src/components/ProductCarousel/ProductCarousel.jsx
import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Container from "react-bootstrap/Container";
import ProductCard from "../ProductCard";
import { motion } from "framer-motion";
import "./ProductCarousel.css";

const containerStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemFade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export default function ProductCarousel({ title = "Produkter", products = [] }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const checkScrollButtons = () => {
    const container = scrollRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollButtons, { passive: true });
      window.addEventListener('resize', checkScrollButtons);
      return () => {
        container.removeEventListener('scroll', checkScrollButtons);
        window.removeEventListener('resize', checkScrollButtons);
      };
    }
  }, [products]);

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  if (!products.length) return null;

  // Sort products to show deals first
  const sortedProducts = [...products].sort((a, b) => {
    const aHasDeal = a?.badge || a?.isDeal ? 1 : 0;
    const bHasDeal = b?.badge || b?.isDeal ? 1 : 0;
    return bHasDeal - aHasDeal;
  });

  return (
    <div className="professional-carousel">
      <Container className="py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="carousel-title mb-0">{title}</h2>
          <div className="carousel-controls d-none d-md-flex">
            <button
              className={`carousel-btn carousel-btn-left ${!canScrollLeft ? 'disabled' : ''}`}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Skrolla åt vänster"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className={`carousel-btn carousel-btn-right ${!canScrollRight ? 'disabled' : ''}`}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Skrolla åt höger"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Product Scroll Container */}
        <div className="carousel-container position-relative">
          <motion.div
            ref={scrollRef}
            className="products-scroll"
            onScroll={checkScrollButtons}
            variants={containerStagger}
            initial="hidden"
            animate="show"
          >
            {sortedProducts.map((product, index) => (
              <motion.div 
                key={product?.id || product?.slug || index} 
                className="product-item"
                variants={itemFade}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
          
          {/* Mobile scroll indicators */}
          <div className="d-md-none scroll-indicators">
            {canScrollLeft && (
              <button
                className="mobile-scroll-btn mobile-scroll-left"
                onClick={() => scroll('left')}
                aria-label="Skrolla åt vänster"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {canScrollRight && (
              <button
                className="mobile-scroll-btn mobile-scroll-right"
                onClick={() => scroll('right')}
                aria-label="Skrolla åt höger"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}