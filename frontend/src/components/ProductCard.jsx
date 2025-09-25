import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function ProductCard({ product, onAddToCart }) {
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

  return (
    <Card className="h-100 product-card">
      {/* Product Image */}
      <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
        {imageUrl ? (
          <Card.Img
            variant="top"
            src={imageUrl}
            alt={product.name}
            style={{ 
              height: '200px', 
              objectFit: 'cover',
              width: '100%'
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
        {product.oldPrice && product.oldPrice > product.price && (
          <Badge 
            bg="danger" 
            className="position-absolute" 
            style={{ top: '10px', left: '10px' }}
          >
            DEAL
          </Badge>
        )}
        
        {!product.inStock && (
          <Badge 
            bg="secondary" 
            className="position-absolute" 
            style={{ top: '10px', right: '10px' }}
          >
            Slut
          </Badge>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title as={Link} to={productUrl} className="text-decoration-none">
          <h6 className="mb-2 text-dark">{product.name}</h6>
        </Card.Title>
        
        {product.shortDescription && (
          <Card.Text className="text-muted small flex-grow-1">
            {product.shortDescription}
          </Card.Text>
        )}

        {/* Price */}
        <div className="mb-2">
          <span className="h6 text-primary mb-0">
            {product.price} kr
          </span>
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="text-muted text-decoration-line-through ms-2 small">
              {product.oldPrice} kr
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          variant={product.inStock ? "primary" : "outline-secondary"}
          size="sm"
          disabled={!product.inStock}
          onClick={() => onAddToCart && onAddToCart(product)}
          className="w-100"
        >
          {product.inStock ? 'Lägg i varukorg' : 'Slut i lager'}
        </Button>
      </Card.Body>
    </Card>
  );
}
