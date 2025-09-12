import React, { useState } from 'react';
import { Heart, ShoppingCart, Eye, Star } from 'lucide-react';
import Button from '../../UI/Button/Button';
import Badge from '../../UI/Badge/Badge';
import { useCart } from '../../../context/CartContext.jsx';
import './ProductCard.css';

const ProductCard = ({
  product,
  onAddToCart,   // optional override
  onWishlist,
  onQuickView,
  featured = false,
  className = ''
}) => {
  const cart = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!product) return null;

  const {
    id, title, name, price, oldPrice, image, images, brand,
    inStock = true, rating, isDeal
  } = product;

  const displayName = name || title || "Produkt";
  const displayImage = image || images?.[0];
  const discount = oldPrice && oldPrice > price
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : null;

  const formatPrice = (p) =>
    new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(Number(p || 0));

  const handleWishlist = () => {
    const next = !isWishlisted;
    setIsWishlisted(next);
    onWishlist?.(product, next);
  };

  const handleAddToCart = () => {
    if (onAddToCart) onAddToCart(product);
    else cart.addItem(product, 1); // ✅ fallback so button always works
  };

  const handleQuickView = () => onQuickView?.(product);

  return (
    <div className={`product-card ${featured ? 'product-card-featured' : ''} ${className}`}>
      <div className="product-card-container">
        {/* Image Area */}
        <div className="product-card-image-area">
          <div className="product-card-image-wrapper">
            {!imageLoaded && (
              <div className="product-card-placeholder">
                <div className="loading-shimmer"></div>
              </div>
            )}
            <img
              src={displayImage}
              alt={displayName}
              className={`product-card-image ${imageLoaded ? 'loaded' : ''}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => { e.currentTarget.src = "/images/placeholder.png"; }}
            />
          </div>

          {/* Badges */}
          {(isDeal || discount) && (
            <div className="product-card-badges">
              {isDeal && <Badge variant="danger" size="small">SUPER DEAL</Badge>}
              {discount && <Badge variant="success" size="small">-{discount}%</Badge>}
            </div>
          )}

          {/* Wishlist */}
          <button
            className={`product-card-wishlist ${isWishlisted ? 'active' : ''}`}
            onClick={handleWishlist}
            aria-label="Toggle wishlist"
            type="button"
          >
            <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
          </button>

          {/* Quick view */}
          <div className="product-card-actions">
            <button
              className="product-card-action-btn"
              onClick={handleQuickView}
              aria-label="Quick view"
              type="button"
            >
              <Eye size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="product-card-content">
          {brand && <div className="product-card-brand">{brand}</div>}

          <h3 className="product-card-title">{displayName}</h3>

          {rating && (
            <div className="product-card-rating">
              <div className="product-card-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={12}
                    fill={star <= rating ? "#fbbf24" : "none"}
                    stroke={star <= rating ? "#fbbf24" : "#d1d5db"}
                  />
                ))}
              </div>
              <span className="product-card-rating-text">({rating})</span>
            </div>
          )}

          <div className="product-card-stock">
            <span className={`product-card-stock-indicator ${inStock ? 'in-stock' : 'out-of-stock'}`}></span>
            <span className="product-card-stock-text">{inStock ? 'I lager' : 'Ej i lager'}</span>
          </div>

          <div className="product-card-price">
            <div className="product-card-current-price">{formatPrice(price)} kr</div>
            {oldPrice && oldPrice > price && (
              <div className="product-card-old-price">{formatPrice(oldPrice)} kr</div>
            )}
          </div>

          <Button
            variant="primary"
            size="medium"
            disabled={!inStock}
            onClick={handleAddToCart}
            icon={<ShoppingCart size={16} />}
            className="product-card-cta"
            type="button"
          >
            {inStock ? 'Lägg i kundvagn' : 'Ej tillgänglig'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
