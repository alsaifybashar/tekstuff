// src/components/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Eye } from "lucide-react";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";

export default function ProductCard({ product }) {
  const { add, items, count } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  if (!product) return null;

  // Handle different product data structures
  const {
    id, 
    slug, 
    title, 
    name, 
    price, 
    oldPrice,
    image, 
    images, 
    brand, 
    inStock = true, 
    isDeal,
    rating,
    // Handle both 'badge' and 'isDeal' properties
    badge
  } = product;

  // Ensure we have a valid product ID
  const productId = id || slug;
  const displayName = name || title || "Produkt";
  const displayImage = image || images?.[0];
  const hasDeal = isDeal || badge === "SUPER DEAL" || badge;
  const discount = oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null;

  const formatPrice = (priceValue) => {
    // Handle different price formats
    const numericPrice = typeof priceValue === 'string' 
      ? parseFloat(priceValue.replace(/[^\d.-]/g, '')) 
      : Number(priceValue) || 0;
    
    return new Intl.NumberFormat('sv-SE', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numericPrice);
  };

  const renderStars = (rating) => {
    if (!rating) return null;
    const stars = [];
    const fullStars = Math.floor(rating);
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-warning">★</span>);
      } else {
        stars.push(<span key={i} className="text-muted">☆</span>);
      }
    }
    return <div className="rating-stars small d-flex">{stars}</div>;
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!productId || !inStock || isAdding) return;
    
    setIsAdding(true);
    
    try {
      console.log('Adding to cart:', { productId, product });
      await add(productId, 1);
      console.log('Successfully added to cart. New count:', count + 1);
      
      // Optional: Show success feedback
      // You could add a toast notification here
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="professional-product-card h-100">
      <div className="card border-0 h-100">
        {/* Image Container */}
        <div className="product-image-container position-relative">
          <Link to={slug ? `/p/${slug}` : `#${productId}`} className="image-wrapper text-decoration-none">
            {!imageLoaded && (
              <div className="image-placeholder d-flex align-items-center justify-content-center">
                <div className="spinner-border spinner-border-sm text-muted" role="status">
                  <span className="visually-hidden">Laddar...</span>
                </div>
              </div>
            )}
            {displayImage && (
              <img
                src={displayImage}
                alt={displayName}
                className={`product-image ${imageLoaded ? 'loaded' : ''}`}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)} // Handle broken images
              />
            )}
          </Link>
          
          {/* Badges */}
          {(hasDeal || !inStock) && (
            <div className="badges-container">
              {hasDeal && (
                <div className="badge bg-danger deal-badge">
                  {discount ? `-${discount}%` : 'REA'}
                </div>
              )}
              {!inStock && (
                <div className="badge bg-secondary stock-badge">
                  Slut
                </div>
              )}
            </div>
          )}

          {/* Wishlist Button */}
          <button
            className={`wishlist-btn ${isWishlisted ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsWishlisted(!isWishlisted);
            }}
            aria-label="Lägg till i önskelista"
          >
            <Heart size={14} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          {/* Quick View on Hover */}
          <div className="quick-actions">
            <Link
              to={slug ? `/p/${slug}` : `#${productId}`}
              className="btn btn-light btn-sm quick-action-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <Eye size={14} />
              <span className="ms-1 d-none d-sm-inline">Visa</span>
            </Link>
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body p-3 d-flex flex-column">
          {/* Brand */}
          {brand && (
            <div className="brand-name text-muted small mb-1">
              {brand}
            </div>
          )}

          {/* Title */}
          <Link 
            to={slug ? `/p/${slug}` : `#${productId}`} 
            className="product-title-link text-decoration-none"
          >
            <h3 className="product-title mb-2">
              {displayName}
            </h3>
          </Link>

          {/* Rating */}
          {rating && (
            <div className="d-flex align-items-center gap-1 mb-2">
              {renderStars(rating)}
              <small className="text-muted ms-1">({rating})</small>
            </div>
          )}

          {/* Stock Status */}
          <div className="stock-status mb-2">
            {inStock ? (
              <small className="text-success d-flex align-items-center">
                <span className="stock-dot bg-success me-1"></span>
                I lager
              </small>
            ) : (
              <small className="text-danger d-flex align-items-center">
                <span className="stock-dot bg-danger me-1"></span>
                Ej i lager
              </small>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-grow-1"></div>

          {/* Price */}
          <div className="price-container mb-3">
            <div className="d-flex align-items-baseline gap-2">
              <span className="current-price fw-bold text-primary">
                {formatPrice(price)} kr
              </span>
              {oldPrice && oldPrice > price && (
                <span className="old-price text-muted text-decoration-line-through small">
                  {formatPrice(oldPrice)} kr
                </span>
              )}
            </div>
          </div>

          {/* Single Add to Cart Button */}
          <button
            className={`btn ${inStock ? 'btn-primary' : 'btn-outline-secondary'} add-to-cart-btn w-100`}
            disabled={!inStock || isAdding || !productId}
            onClick={handleAddToCart}
          >
            {isAdding ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Laddar...</span>
                </div>
                <span>Lägger till...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} className="me-1" />
                <span>{inStock ? 'Lägg i kundvagn' : 'Ej tillgänglig'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}