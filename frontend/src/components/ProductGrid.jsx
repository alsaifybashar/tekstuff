import React from 'react';
import { Row, Col } from 'react-bootstrap';
import ProductCard from './ProductCard';

export default function ProductGrid({ products, loading, onAddToCart }) {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading products...</span>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-box" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
        <h4 className="mt-3 text-muted">Inga produkter hittades</h4>
        <p className="text-muted">Prova att ändra dina filter eller sök efter något annat.</p>
      </div>
    );
  }

  return (
    <Row>
      {products.map((product) => (
        <Col key={product.id} xs={6} md={4} lg={3} className="mb-4">
          <ProductCard 
            product={product} 
            onAddToCart={onAddToCart}
          />
        </Col>
      ))}
    </Row>
  );
}
