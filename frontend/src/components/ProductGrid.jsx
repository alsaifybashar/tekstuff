// src/components/ProductGrid.jsx
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Ratio from "react-bootstrap/Ratio";
import { Link } from "react-router-dom";

// Local helper so we don't depend on external utils:
const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function ProductGrid({ products = [] }) {
  return (
    <Row className="g-3">
      {products.map((p, idx) => {
        const urlSlug = p.slug || slugify(p.title || p.name || p.id);
        const key = p.id || p.sku || urlSlug || `item-${idx}`;
        const inStock = p.inStock !== false; // default true unless explicitly false

        return (
          <Col key={key} xs={6} md={4} xl={3}>
            <Card className="h-100 shadow-sm position-relative">

              {/* Badges */}
              <div className="position-absolute top-0 start-0 m-2 d-flex gap-2" style={{ zIndex: 2 }}>
                {p.isDeal && (
                  <Badge bg="warning" text="dark" className="fw-bold rounded-pill">SUPER DEAL</Badge>
                )}
                {!inStock && <Badge bg="secondary" className="rounded-pill">Slut i lager</Badge>}
              </div>

              {/* Image (clickable) */}
              <Link to={`/p/${urlSlug}`} aria-label={`Visa ${p.title || p.name || "produkt"}`}>
                <Ratio aspectRatio="4x3">
                  <Card.Img
                    src={p.image || p.images?.[0]}
                    alt={p.title || p.name || "Produktbild"}
                    className="object-fit-contain p-3"
                    loading="lazy"
                  />
                </Ratio>
              </Link>

              {/* Body */}
              <Card.Body className="d-flex flex-column">
                {p.brand && <div className="small text-muted mb-1">{p.brand}</div>}

                {/* Title (stretched link makes whole card clickable) */}
                <Card.Title as="h3" className="fs-6 mb-2">
                  <Link to={`/p/${urlSlug}`} className="stretched-link text-reset text-decoration-none">
                    {p.title || p.name}
                  </Link>
                </Card.Title>

                <div className="mt-auto">
                  <div className="d-flex align-items-baseline gap-2">
                    {typeof p.price !== "undefined" && (
                      <span className="fs-5 fw-bold">{p.price} kr</span>
                    )}
                    {p.oldPrice && (
                      <span className="text-decoration-line-through text-muted">{p.oldPrice} kr</span>
                    )}
                  </div>

                  {/* You can hook this up to your CartContext if desired */}
                  <div className="d-grid mt-2">
                    {inStock ? (
                      <Button
                        variant="dark"
                        onClick={(e) => {
                          e.preventDefault();
                          // Optional: wire up your CartContext here:
                          // const { add } = useCart();
                          // add({ ...p, qty: 1 });
                          // For now, send them to details (primary user flow)
                          window.location.assign(`/p/${urlSlug}`);
                        }}
                      >
                        se detaljer
                      </Button>
                    ) : (
                      <Button variant="outline-secondary" disabled>
                        Ej tillgänglig
                      </Button>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
