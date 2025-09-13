import Navbar from "../components/Navbar";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";
import Button from "react-bootstrap/Button";
import Offcanvas from "react-bootstrap/Offcanvas";
import { Filter } from "lucide-react";

import allProducts from "../data/products.js";
import { buildFacets, applyFilters } from "../lib/catalog";
import FilterSidebar from "../components/FilterSidebar";
import ProductGrid from "../components/ProductGrid";
import Footer from "../components/Footer/Footer";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [filters, setFilters] = useState({ sort: "popularity" });
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const map = { laptops: "laptops", phones: "phones", chargers: "chargers", cables: "cables" };
  const key = map[categorySlug?.toLowerCase()] ?? categorySlug?.toLowerCase();
  
  const products = useMemo(() => 
    allProducts.filter(p => p.category.toLowerCase() === key), [key]
  );

  const facets = useMemo(() => buildFacets(products), [products]);
  const filtered = useMemo(() => applyFilters({ products, filters }), [products, filters]);

  // Initialize price filter to facet bounds
  useEffect(() => {
    if (!filters.price && facets.price.min < Infinity) {
      setFilters(f => ({ ...f, price: [facets.price.min, facets.price.max] }));
    }
  }, [facets.price.min, facets.price.max]);

  const update = (partial) => setFilters((f) => ({ ...f, ...partial }));
  const clear = () => setFilters({ sort: filters.sort });

  // Count active filters
  const activeFiltersCount = [
    filters.price && (filters.price[0] !== facets.price.min || filters.price[1] !== facets.price.max),
    filters.brands?.length > 0,
    Object.values(filters.attrs || {}).some(arr => arr?.length > 0),
    filters.rating,
    filters.inStock,
    filters.deals
  ].filter(Boolean).length;

  return (
    <>
      <Navbar />
      <br/>
      <Container className="py-4">
        {/* Breadcrumb & Header */}
        <div className="small text-muted mb-2">Hem / {categorySlug}</div>
        <Row className="align-items-center g-2 mb-4">
          <Col>
            <h1 className="h3 m-0 text-capitalize">{titleFor(categorySlug)}</h1>
            <p className="text-muted mb-0">
              {filtered.length} av {products.length} produkter
            </p>
          </Col>
          <Col xs="auto" className="ms-auto d-flex gap-2">
            {/* Mobile Filter Button */}
            <Button
              variant="outline-primary"
              className="d-lg-none d-flex align-items-center gap-2"
              onClick={() => setShowMobileFilters(true)}
            >
              <Filter size={16} />
              Filter
              {activeFiltersCount > 0 && (
                <span className="badge bg-primary rounded-pill ms-1">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
            
            {/* Sort Dropdown */}
            <Sort value={filters.sort} onChange={(sort) => update({ sort })} />
          </Col>
        </Row>

        <Row className="g-4">
          {/* Desktop Sidebar */}
          <Col lg={3} className="d-none d-lg-block">
            <div className="position-sticky" style={{ top: '2rem' }}>
              <FilterSidebar 
                facets={facets} 
                value={filters} 
                onChange={update} 
                onClear={clear} 
              />
            </div>
          </Col>

          {/* Product Grid */}
          <Col lg={9}>
            {/* Active Filters Summary - Mobile */}
            {activeFiltersCount > 0 && (
              <div className="d-lg-none mb-3 p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    {activeFiltersCount} filter aktiva
                  </small>
                  <Button variant="link" size="sm" onClick={clear} className="p-0">
                    Rensa alla
                  </Button>
                </div>
              </div>
            )}
            
            <ProductGrid products={filtered} />
            
            {filtered.length === 0 && (
              <div className="text-center py-5">
                <div className="mb-3">
                  <Filter size={48} className="text-muted" />
                </div>
                <h4 className="text-muted">Inga produkter hittades</h4>
                <p className="text-muted mb-3">
                  Prova att justera dina filterinställningar
                </p>
                <Button variant="outline-primary" onClick={clear}>
                  Rensa alla filter
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      {/* Mobile Filter Offcanvas */}
      <Offcanvas 
        show={showMobileFilters} 
        onHide={() => setShowMobileFilters(false)}
        placement="start"
        className="mobile-filter-offcanvas"
      >
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title className="d-flex align-items-center gap-2">
            <Filter size={20} />
            Filter produkter
            {activeFiltersCount > 0 && (
              <span className="badge bg-primary rounded-pill">
                {activeFiltersCount}
              </span>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <FilterSidebar 
            facets={facets} 
            value={filters} 
            onChange={update} 
            onClear={clear} 
          />
        </Offcanvas.Body>
        <div className="border-top p-3">
          <Button 
            variant="primary" 
            className="w-100" 
            onClick={() => setShowMobileFilters(false)}
          >
            Visa {filtered.length} produkter
          </Button>
        </div>
      </Offcanvas>

      <br/>
      <Footer />
    </>
  );
}

function Sort({ value, onChange }) {
  const options = [
    ["popularity", "Mest populärt"],
    ["price_asc", "Lägsta pris"],
    ["price_desc", "Högsta pris"],
    ["rating_desc", "Betyg"]
  ];
  const label = options.find(([v]) => v === value)?.[1] || "Mest populärt";
  
  return (
    <Dropdown>
      <Dropdown.Toggle 
        size="sm" 
        variant="outline-secondary"
        className="d-flex align-items-center gap-2"
      >
        Sortera: {label}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        {options.map(([v, l]) => (
          <Dropdown.Item 
            key={v} 
            active={v === value} 
            onClick={() => onChange(v)}
          >
            {l}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

const titleFor = (slug) => ({
  chargers: "Kablar & Laddare",
  cables: "Kablar",
  laptops: "Laptops",
  phones: "Telefoner"
}[slug] || slug);