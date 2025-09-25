import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import ProductImageGallery from "../components/ProductImageGallery";
import PriceBlock from "../components/PriceBlock";
import QuantityPicker from "../components/QuantityPicker";
import ProductCarousel from "../components/Product/ProductCarousel/ProductCarousel";
import Section from '../components/Layout/Section/Section';

import { useCart } from "../context/CartContext";
import { useProduct, useProducts } from "../hooks/useProducts";

const kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

export default function ProductPage() {
  const { slug } = useParams();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  // Use backend data
  const { product, loading, error } = useProduct(slug);
  const { products: relatedProducts } = useProducts({ 
    category: product?.category?.slug, 
    limit: 8 
  });

  const handleAddToCart = (product) => {
    if (product?.id && product?.inStock) {
      add(product.id, qty);
      console.log(`Added ${qty} of product ${product.id} to cart`);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading product...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Product Not Found</Alert.Heading>
          <p>The requested product could not be found.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      
      <main className="flex-grow-1">
        <Container className="py-4">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="mb-4">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/">Hem</a>
              </li>
              {product.category && (
                <li className="breadcrumb-item">
                  <a href={`/c/${product.category.slug}`}>
                    {product.category.name}
                  </a>
                </li>
              )}
              <li className="breadcrumb-item active" aria-current="page">
                {product.name}
              </li>
            </ol>
          </nav>

          <Row>
            {/* Product Images */}
            <Col md={6}>
              <ProductImageGallery 
                images={product.images} 
                productName={product.name}
              />
            </Col>

            {/* Product Info */}
            <Col md={6}>
              <div className="product-info">
                <h1 className="h2 mb-3">{product.name}</h1>
                
                {product.shortDescription && (
                  <p className="lead text-muted mb-4">
                    {product.shortDescription}
                  </p>
                )}

                <PriceBlock 
                  price={product.price}
                  oldPrice={product.oldPrice}
                  className="mb-4"
                />

                {/* Stock Status */}
                <div className="mb-4">
                  {product.inStock ? (
                    <span className="badge bg-success">
                      ✓ I lager ({product.stockQuantity} kvar)
                    </span>
                  ) : (
                    <span className="badge bg-danger">
                      Slut i lager
                    </span>
                  )}
                </div>

                {/* Add to Cart */}
                <div className="d-flex align-items-center gap-3 mb-4">
                  <QuantityPicker
                    value={qty}
                    onChange={setQty}
                    max={product.stockQuantity}
                    disabled={!product.inStock}
                  />
                  
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!product.inStock}
                    onClick={() => handleAddToCart(product)}
                    className="flex-grow-1"
                  >
                    {product.inStock ? 'Lägg i varukorg' : 'Slut i lager'}
                  </Button>
                </div>

                {/* Product Details */}
                <div className="product-details">
                  <h3>Produktdetaljer</h3>
                  <ul className="list-unstyled">
                    <li><strong>SKU:</strong> {product.sku}</li>
                    {product.brand && (
                      <li><strong>Märke:</strong> {product.brand}</li>
                    )}
                    {product.weight && (
                      <li><strong>Vikt:</strong> {product.weight}g</li>
                    )}
                  </ul>
                </div>
              </div>
            </Col>
          </Row>

          {/* Product Description */}
          {product.description && (
            <Row className="mt-5">
              <Col>
                <h3>Beskrivning</h3>
                <div 
                  className="product-description"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </Col>
            </Row>
          )}

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <Section title="Relaterade produkter" className="mt-5">
              <ProductCarousel 
                products={relatedProducts}
                onAddToCart={(p) => handleAddToCart(p)}
              />
            </Section>
          )}
        </Container>
      </main>
      
      <Footer />
    </div>
  );
}
