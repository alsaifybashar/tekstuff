// src/components/ProductGrid.jsx
import { Link } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

const kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

export default function ProductGrid({ products = [] }) {
  if (!products.length) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">Inga produkter hittades.</p>
      </div>
    );
  }

  return (
    <Row className="g-3">
      {products.map((product) => (
        <Col key={product.id} xs={6} sm={6} md={4} lg={3}>
          <Card className="h-100 border-0 shadow-sm product-card">
            <Link 
              to={`/p/${product.slug || product.id}`} 
              className="text-decoration-none text-dark"
            >
              <div className="position-relative">
                <Card.Img
                  variant="top"
                  src={product.image || product.images?.[0] || "/images/placeholder.png"}
                  alt={product.title || product.name}
                  className="product-image"
                  style={{ 
                    height: "200px", 
                    objectFit: "cover",
                    transition: "transform 0.2s ease-in-out"
                  }}
                />
                {product.isDeal && (
                  <Badge 
                    bg="danger" 
                    className="position-absolute top-0 start-0 m-2"
                  >
                    SUPER DEAL
                  </Badge>
                )}
                {!product.inStock && (
                  <Badge 
                    bg="secondary" 
                    className="position-absolute top-0 end-0 m-2"
                  >
                    Slut i lager
                  </Badge>
                )}
              </div>
            </Link>
            
            <Card.Body className="d-flex flex-column">
              <Link 
                to={`/p/${product.slug || product.id}`} 
                className="text-decoration-none text-dark"
              >
                <Card.Title className="h6 mb-1 line-clamp-2">
                  {product.title || product.name}
                </Card.Title>
              </Link>
              
              {product.brand && (
                <Card.Text className="text-muted small mb-2">
                  {product.brand}
                </Card.Text>
              )}
              
              <div className="mt-auto">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold text-primary">
                    {kr.format(product.price)} kr
                  </span>
                  {product.oldPrice && product.oldPrice > product.price && (
                    <span className="text-muted text-decoration-line-through small">
                      {kr.format(product.oldPrice)} kr
                    </span>
                  )}
                </div>
                
                {product.rating && product.rating > 0 && (
                  <div className="text-warning small">
                    {"★".repeat(Math.floor(product.rating))}
                    <span className="text-muted ms-1">
                      ({product.rating})
                    </span>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

// Add these styles to your CSS file
const styles = `
.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-card {
  transition: box-shadow 0.2s ease-in-out;
}

.product-card:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.15) !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;