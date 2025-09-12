// src/pages/ProductPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Badge from "react-bootstrap/Badge";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import ProductImageGallery from "../components/ProductImageGallery";
import PriceBlock from "../components/PriceBlock";
import QuantityPicker from "../components/QuantityPicker";
import ProductCarousel from "../components/Product/ProductCarousel/ProductCarousel";

import { useCart } from "../context/CartContext";
import { getProductBySlug, getProductById, getRelatedProducts } from "../services/catalog";

const kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

export default function ProductPage() {
  const { slug } = useParams(); // route: /p/:slug
  const { add } = useCart();

  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr(null);
      setProduct(null);

      try {
        // Try to find product by slug first, then by id
        let p = getProductBySlug(slug) || getProductById(slug);

        if (!p) {
          throw new Error("Produkten hittades inte.");
        }

        // Normalize numerics
        p.price = Number(p.price) || 0;
        if (p.oldPrice != null) p.oldPrice = Number(p.oldPrice);

        setProduct(p);

        // Get related products
        const relatedProducts = getRelatedProducts(p, 8);
        setRelated(relatedProducts);

      } catch (e) {
        setErr(e.message || "Något gick fel.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [slug]);

  const addToCart = () => {
    if (!product?.id) return;
    add(product.id, Math.max(1, Math.floor(qty || 1)));
  };

  const specs = useMemo(() => {
    if (!product?.specs) return [];

    // Convert specs object to array of [label, value]
    return Object.entries(product.specs);
  }, [product]);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />

      <main className="flex-grow-1">
        <Container fluid="xl" className="py-4">
          {loading && (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Laddar produkt…</span>
            </div>
          )}

          {err && !loading && (
            <Alert variant="danger">{err}</Alert>
          )}

          {!loading && !err && product && (
            <>
              <Row className="g-4">
                {/* Left: images */}
                <Col xs={12} md={6} lg={6}>
                  <ProductImageGallery
                    images={product.images?.length ? product.images : [product.image].filter(Boolean)}
                    alt={product.title || product.name || "Produkt"}
                  />
                </Col>

                {/* Right: title, price, actions */}
                <Col xs={12} md={6} lg={6}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    {product.isDeal && (
                      <Badge bg="danger">SUPER DEAL</Badge>
                    )}
                    {product.inStock ? (
                      <Badge bg="success">I lager</Badge>
                    ) : (
                      <Badge bg="secondary">Ej i lager</Badge>
                    )}
                  </div>

                  <h1 className="h4 mb-1">
                    {product.title || product.name || "Produkt"}
                  </h1>
                  {product.brand && (
                    <div className="text-muted mb-2">{product.brand}</div>
                  )}

                  <PriceBlock price={product.price} oldPrice={product.oldPrice} />

                  <div className="d-flex align-items-center gap-3 mb-3">
                    <QuantityPicker value={qty} onChange={setQty} min={1} max={99} />
                    <Button
                      variant="dark"
                      size="lg"
                      disabled={!product.inStock}
                      onClick={addToCart}
                    >
                      Lägg i kundvagn
                    </Button>
                  </div>

                  {/* Simple facts/specs */}
                  {specs.length > 0 && (
                    <div className="border rounded p-3">
                      <h2 className="h6 mb-3">Specifikationer</h2>
                      <dl className="row mb-0">
                        {specs.map(([k, v]) => (
                          <div className="col-12 d-flex" key={k}>
                            <dt className="me-2 text-muted" style={{ width: 120 }}>{k}</dt>
                            <dd className="mb-1">{String(v)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </Col>
              </Row>

              {/* Description block */}
              {product.description && (
                <Row className="g-4 mt-3">
                  <Col md={12}>
                    <div className="border rounded p-3">
                      <h2 className="h6 mb-2">Produktbeskrivning</h2>
                      <p className="mb-0">{product.description}</p>
                    </div>
                  </Col>
                </Row>
              )}

              {/* Long description */}
              {product.longDescription && (
                <Row className="g-4 mt-3">
                  <Col md={12}>
                    <div className="border rounded p-3">
                      <h2 className="h6 mb-2">Detaljerad beskrivning</h2>
                      <p className="mb-0">{product.longDescription}</p>
                    </div>
                  </Col>
                </Row>
              )}

              {/* Related / Similar products */}
              <Row className="mt-4">
                <Col>
                  <ProductCarousel
                    title="Liknande produkter"
                    products={toCarouselProducts(related)}
                  />
                </Col>
              </Row>
            </>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}

/**
 * Adapt generic product objects to your ProductCarousel's expected shape.
 */
function toCarouselProducts(items = []) {
  return items.map((p) => ({
    badge: p.isDeal ? "SUPER DEAL" : undefined,
    id: p.id,
    image: p.image || p.images?.[0],
    title: p.title || p.name || "Produkt",
    subtitle: p.brand || "",
    price: toKr(p.price),
    oldPrice: p.oldPrice != null ? toKr(p.oldPrice) : undefined,
  }));
}

function toKr(n) {
  const v = Math.round(Number(n) || 0);
  return `${v} kr`;
}