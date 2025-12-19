import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  if (!product) return null;

  // Handle different image formats from backend
  const getProductImage = (product) => {
    // Try different possible image formats
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (product.image) {
      return product.image;
    }
    if (product.primaryImage) {
      return product.primaryImage;
    }
    // Return placeholder if no image
    return null;
  };

  const imageUrl = getProductImage(product);
  const productUrl = `/p/${product.slug || product.id}`;

  const handleCardClick = () => {
    navigate(productUrl);
  };

  return (
    <Card
      className="h-100 product-card shadow-sm border-0"
      onClick={handleCardClick}
      style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
    >
      {/* Product Image */}
      <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
        {imageUrl ? (
          <Card.Img
            variant="top"
            src={imageUrl}
            alt={product.name}
            style={{
              height: '200px',
              objectFit: 'contain',
              width: '100%',
              padding: '10px'
            }}
            onError={(e) => {
              // If image fails to load, show placeholder
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Placeholder shown when no image or image fails */}
        <div
          className="d-flex align-items-center justify-content-center bg-light"
          style={{
            height: '200px',
            display: imageUrl ? 'none' : 'flex',
            position: imageUrl ? 'absolute' : 'static',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div className="text-center text-muted">
            <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
            <br />
            <small>Product Image</small>
          </div>
        </div>

        {/* Badges */}
        <div className="position-absolute top-0 start-0 w-100 p-2 d-flex justify-content-between pointer-events-none">
          <div>
            {product.oldPrice && product.oldPrice > product.price && (
              <Badge bg="danger" className="me-1">
                -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
              </Badge>
            )}
            {!product.inStock && <Badge bg="secondary">Slut</Badge>}
          </div>
        </div>
      </div>

      <Card.Body className="d-flex flex-column p-3">
        {/* Brand or Category (optional, good for layout balance) */}
        {product.category_name && (
          <small className="text-muted mb-1 text-uppercase" style={{ fontSize: '0.7rem' }}>
            {product.category_name}
          </small>
        )}

        <Card.Title className="text-decoration-none mb-2">
          <h6 className="text-dark text-truncate-2-lines" style={{ minHeight: '40px', lineHeight: '1.4' }}>
            {product.name}
          </h6>
        </Card.Title>

        <div className="mt-auto">
          {product.oldPrice && product.oldPrice > product.price ? (
            <div className="mb-2">
              <span className="d-block text-muted text-decoration-line-through small">
                {product.oldPrice} kr
              </span>
              <span className="h5 text-danger fw-bold">
                {product.price} kr
              </span>
            </div>
          ) : (
            <div className="mb-2 h5 fw-bold text-dark">
              {product.price} kr
            </div>
          )}

          <Button
            variant={product.inStock ? "primary" : "outline-secondary"}
            size="sm"
            disabled={!product.inStock}
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click
              e.preventDefault();
              onAddToCart && onAddToCart(product);
            }}
            className="w-100 rounded-pill fw-semibold"
          >
            {product.inStock ? (
              <>
                <i className="bi bi-cart-plus me-1"></i> Lägg i kundvagn
              </>
            ) : 'Bevaka'}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
