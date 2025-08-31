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
            <Card className="h-100 shadow-sm">
              <div className="position-relative">
                {/* badge ... */}
                <Link to={`/p/${p.slug}`}>                       {/* ⟵ link to product */}
                  <Ratio aspectRatio="4x3">
                    <Card.Img src={p.image} alt={p.title} className="object-fit-contain p-3" loading="lazy" />
                  </Ratio>
                </Link>
              </div>
              <Card.Body className="d-flex flex-column">
                <div className="small text-muted mb-1">{p.brand}</div>
                <Card.Title as="h3" className="fs-6">
                  <Link to={`/p/${p.slug}`} className="stretched-link text-decoration-none text-dark">{p.title}</Link>
                </Card.Title>
                <div className="mt-auto">
                  {/* ✅ Price */}
                  <div className="d-flex align-items-baseline gap-2">
                    <span className="fs-5 fw-bold">{p.price} kr</span>
                    {p.oldPrice && (
                      <span className="text-decoration-line-through text-muted">
                        {p.oldPrice} kr
                      </span>
                    )}
                  </div>

                  {/* ✅ Add to cart button */}
                  <Button
                    variant="dark"
                    className="w-100 mt-2"
                    onClick={() => addItem(p, 1)}   // ⟵ adds 1 qty
                  >
                    Lägg i varukorg
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}
