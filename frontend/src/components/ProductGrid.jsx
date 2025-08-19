import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Ratio from "react-bootstrap/Ratio";

export default function ProductGrid({ products }) {
  return (
    <Row className="g-3">
      {products.map(p => (
        <Col key={p.id} xs={6} md={4} xl={3}>
          <Card className="h-100 shadow-sm">
            <div className="position-relative">
              {p.isDeal && (
                <Badge bg="warning" text="dark"
                       className="position-absolute top-0 start-0 m-2 fw-bold rounded-pill"
                       style={{ zIndex: 2 }}>
                  SUPER DEAL
                </Badge>
              )}
              <Ratio aspectRatio="4x3">
                <Card.Img src={p.image} alt={p.title}
                          className="object-fit-contain p-3" loading="lazy" />
              </Ratio>
            </div>
            <Card.Body className="d-flex flex-column">
              <div className="small text-muted mb-1">{p.brand}</div>
              <Card.Title as="h3" className="fs-6">{p.title}</Card.Title>
              <div className="mt-auto">
                <div className="d-flex align-items-baseline gap-2">
                  <span className="fs-5 fw-bold">{p.price} kr</span>
                  {p.oldPrice && <span className="text-decoration-line-through text-muted">{p.oldPrice} kr</span>}
                </div>
                <Button variant="dark" className="w-100 mt-2">Lägg i varukorg</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}



