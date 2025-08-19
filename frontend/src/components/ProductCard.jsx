import { motion } from "framer-motion";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import Ratio from "react-bootstrap/Ratio";

const MotionCard = motion(Card);

export default function ProductCard({ image, title, subtitle, price, oldPrice, badge, onAddToCart }) {
  const hasDiscount = oldPrice && Number(price) < Number(oldPrice);

  return (
    <MotionCard
      className="h-100 shadow-sm"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} // Apple-ish springy ease
      style={{ willChange: "transform" }}
    >
      <div className="position-relative">
        {badge && (
          <Badge bg="warning" text="dark"
            className="position-absolute top-0 start-0 m-2 rounded-pill fw-bold deal-badge">
            {badge}
          </Badge>
        )}
        <Ratio aspectRatio="4x3">
          <Card.Img src={image} alt={title} className="object-fit-contain p-3" loading="lazy" decoding="async" />
        </Ratio>
      </div>

      <Card.Body className="d-flex flex-column">
        {subtitle && <div className="text-muted small mb-1">{subtitle}</div>}
        <Card.Title as="h3" className="fs-6 mb-2">{title}</Card.Title>

        <div className="mt-auto">
          <div className="d-flex align-items-baseline gap-2">
            <span className="fs-4 fw-bold">{price}</span>
            {hasDiscount && <span className="text-decoration-line-through text-muted">{oldPrice}</span>}
          </div>
          <Button variant="dark" className="w-100 mt-3" onClick={onAddToCart}>
            Lägg i varukorg
          </Button>
        </div>
      </Card.Body>
    </MotionCard>
  );
}
