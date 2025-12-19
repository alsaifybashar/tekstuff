import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Alert from "react-bootstrap/Alert";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import FilterSidebar from "../components/FilterSidebar";
import ProductGrid from "../components/ProductGrid";

import { useProducts } from "../hooks/useProducts";
import { useCart } from "../context/CartContext";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [filters, setFilters] = useState({
    category: categorySlug,
    sort: "popularity"
  });

  // Use backend data with the category filter
  const { products, loading, error } = useProducts(filters);
  const { addItem } = useCart();

  const handleAddToCart = (product) => {
    addItem(product);
  };

  const update = (partial) => setFilters(f => ({ ...f, ...partial }));
  const clear = () => setFilters({ category: categorySlug, sort: filters.sort });

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Error loading products: {error}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Navbar />
      <br />
      <Container className="py-4">
        {/* Breadcrumb & Header */}
        <div className="small text-muted mb-2">Hem / {categorySlug}</div>

        <Row className="mb-4">
          <Col>
            <h1 className="h3 m-0 text-capitalize">
              {categorySlug?.replace('-', ' ')}
            </h1>
            <p className="text-muted mb-0">
              {products?.length || 0} produkter
            </p>
          </Col>
        </Row>

        <Row>
          {/* Desktop Sidebar */}
          <Col lg={3} className="d-none d-lg-block">
            <FilterSidebar
              filters={filters}
              onUpdate={update}
              onClear={clear}
              activeCount={0}
            />
          </Col>

          {/* Products Grid */}
          <Col lg={9}>
            {products && products.length > 0 ? (
              <ProductGrid products={products} onAddToCart={handleAddToCart} />
            ) : (
              <Alert variant="info">
                <h4>Inga produkter hittades</h4>
                <p>Det finns inga produkter i kategorin "{categorySlug}" just nu.</p>
                <p className="mb-0">
                  <a href="/" className="alert-link">← Tillbaka till startsidan</a>
                </p>
              </Alert>
            )}
          </Col>
        </Row>
      </Container>

      <Footer />
    </>
  );
}
