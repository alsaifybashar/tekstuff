import Navbar from "../components/Navbar";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Dropdown from "react-bootstrap/Dropdown";

import allProducts from "../data/products.js";           // ← Vite lets you import JSON
import { buildFacets, applyFilters } from "../lib/catalog";
import FilterSidebar from "../components/FilterSidebar";
import ProductGrid from "../components/ProductGrid";
import Footer from "../components/Footer/Footer";

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [filters, setFilters] = useState({ sort: "popularity" });


  const map = { laptops: "laptops", phones: "phones", chargers: "chargers", cables: "cables" };

  const key = map[categorySlug?.toLowerCase()] ?? categorySlug?.toLowerCase();
const products = useMemo(() => allProducts.filter(p => p.category.toLowerCase() === key), [key]);

  // Narrow products to this category (dummy data)
 // const products = useMemo(
 //   () => allProducts.filter(p => p.category === categorySlug),
  //  [categorySlug]
  //);

  const facets = useMemo(() => buildFacets(products), [products]);
  const filtered = useMemo(() => applyFilters({ products, filters }), [products, filters]);

  // Ensure price filter is initialized to the facet bounds
  useEffect(() => {
    if (!filters.price && facets.price.min < Infinity) {
      setFilters(f => ({ ...f, price: [facets.price.min, facets.price.max] }));
    }
  }, [facets.price.min, facets.price.max]); // eslint-disable-line

  const update = (partial) => setFilters((f) => ({ ...f, ...partial }));
  const clear = () => setFilters({ sort: filters.sort }); // keep current sorting

  return (
    <>
    <Navbar />
    <br/>
    <Container className="py-4">
      {/* Breadcrumb placeholder & title */}
      <div className="small text-muted mb-2">Hem / {categorySlug}</div>
      <Row className="align-items-center g-2 mb-3">
        <Col><h1 className="h3 m-0 text-capitalize">{titleFor(categorySlug)}</h1></Col>
        <Col xs="auto" className="ms-auto">
          <Sort value={filters.sort} onChange={(sort) => update({ sort })} />
        </Col>
      </Row>

      <Row className="g-4">
        {/* Sidebar */}
        <Col lg={3} className="d-none d-lg-block">
          <FilterSidebar facets={facets} value={filters} onChange={update} onClear={clear} />
        </Col>

        {/* Grid */}
        <Col lg={9}>
          <ProductGrid products={filtered} />
        </Col>
      </Row>
    </Container>

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
      <Dropdown.Toggle size="sm" variant="outline-secondary">{label}</Dropdown.Toggle>
      <Dropdown.Menu>
        {options.map(([v, l]) => (
          <Dropdown.Item key={v} active={v === value} onClick={() => onChange(v)}>{l}</Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}




const titleFor = (slug) => ({
  chargers: "Kablar & Laddare",
  cables: "Kablar"
}[slug] || slug);
