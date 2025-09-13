import React, { useState } from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import Button from '../../UI/Button/Button';
import Badge from '../../UI/Badge/Badge';
import { useCart } from '../../../context/CartContext.jsx';
import './ProductCard.css';

const ProductCard = ({
  product,
  onAddToCart,   // optional override
  featured = false,
  className = ''
}) => {
  const cart = useCart();
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

  const handleAddToCart = (e) => {
    // Prevent the click from bubbling up to the parent card click handler
    if (e && typeof e.stopPropagation === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!product.inStock) {
      console.warn('Product is out of stock');
      return;
    }

    try {
      if (onAddToCart) {
        onAddToCart(product);
      } else if (cart.add) {
        cart.add(product.id, 1);
        console.log('Added to cart:', product.id);
      } else {
        console.warn("No add to cart function available");
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

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