import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../ProductCard/ProductCard';
import Button from '../../UI/Button/Button';
import { useCart } from '../../../context/CartContext';
import './ProductCarousel.css';

const ProductCarousel = ({
  title,
  products = [],
  featured = false,
  onAddToCart,   // optional
  onWishlist,
  onQuickView,
  className = ''
}) => {
  const scrollRef = useRef(null);
  const cart = useCart();
  const add = (p) => (onAddToCart ? onAddToCart(p) : cart.addItem(p, 1));

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateButtons();
    const onScroll = () => updateButtons();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateButtons);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateButtons);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.max(280, el.clientWidth * 0.8);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <section className={`product-carousel ${className}`}>
      {/* Header */}
      <div className="product-carousel-header">
        <h2 className="product-carousel-title">{title}</h2>
        <div className="product-carousel-controls">
          <Button
            variant="outline"
            size="small"
            disabled={!canLeft}
            onClick={() => scroll('left')}
            icon={<ChevronLeft size={20} />}
            aria-label="Scroll left"
            type="button"
          />
          <Button
            variant="outline"
            size="small"
            disabled={!canRight}
            onClick={() => scroll('right')}
            icon={<ChevronRight size={20} />}
            aria-label="Scroll right"
            type="button"
          />
        </div>
      </div>

      {/* End-arrows placement & scroll area */}
      <div className="product-carousel-container">
        {/* End arrows (outside edges on desktop/tablet) */}
        <button
          type="button"
          className="pc-end-arrow pc-end-arrow-left d-none d-sm-flex"
          onClick={() => scroll('left')}
          disabled={!canLeft}
          aria-label="Föregående"
        >
          <ChevronLeft size={18} />
        </button>

        <div ref={scrollRef} className="product-carousel-scroll" role="list" aria-label="Produktkarusell">
          {products.map((product, index) => (
            <div key={product?.id || index} className="product-carousel-slide" role="listitem">
              <ProductCard
                product={product}
                featured={featured}
                onAddToCart={add}
                onWishlist={onWishlist}
                onQuickView={onQuickView}
              />
              <div className="pc-underline" />
            </div>
          ))}
        </div>

        <button
          type="button"
          className="pc-end-arrow pc-end-arrow-right d-none d-sm-flex"
          onClick={() => scroll('right')}
          disabled={!canRight}
          aria-label="Nästa"
        >
          <ChevronRight size={18} />
        </button>

        {/* Mobile overlay arrows (still allow swipe) */}
        <div className="pc-mobile-arrows d-flex d-md-none" aria-hidden="true">
          <button type="button" className="pc-mobile-btn" onClick={() => scroll('left')} disabled={!canLeft}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" className="pc-mobile-btn" onClick={() => scroll('right')} disabled={!canRight}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
