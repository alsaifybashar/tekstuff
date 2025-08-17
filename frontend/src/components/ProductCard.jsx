// src/components/ProductCard.jsx
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Ratio from "react-bootstrap/Ratio";

export default function ProductCard({
  image,
  title,
  subtitle,
  price,
  oldPrice,
  badge,
  onAddToCart,
}) {
  const hasDiscount = oldPrice && Number(price) < Number(oldPrice);

  return (
    <Card className="h-100 shadow-sm">
      <div className="position-relative">
        {badge && (
          <Badge
            bg="warning"
            text="dark"
            className="position-absolute top-0 start-0 m-2 rounded-pill fw-bold deal-badge"
          >
            {badge}
          </Badge>
        )}
        <Ratio aspectRatio="4x3">
          <Card.Img
            src={image}
            alt={title}
            className="object-fit-contain p-3"
            loading="lazy"
            decoding="async"
          />
        </Ratio>
      </div>

      <Card.Body className="d-flex flex-column">
        {subtitle && <div className="text-muted small mb-1">{subtitle}</div>}
        <Card.Title as="h3" className="fs-6 mb-2">
          {title}
        </Card.Title>

        <div className="mt-auto">
          <div className="d-flex align-items-baseline gap-2">
            <span className="fs-4 fw-bold">{price}</span>
            {hasDiscount && (
              <span className="text-decoration-line-through text-muted">
                {oldPrice}
              </span>
            )}
          </div>
          <Button
            variant="dark"
            className="w-100 mt-3"
            onClick={onAddToCart}
            aria-label={`Add ${title} to cart`}
          >
            Lägg i varukorg
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
