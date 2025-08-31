// src/components/ProductCarousel/ProductCarousel.jsx
import "./ProductCarousel.css";
import Carousel from "react-bootstrap/Carousel";
import Container from "react-bootstrap/Container";
import ProductCard from "../ProductCard";
import { motion } from "framer-motion";

const containerStagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemFade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const chunk = (arr, size) =>
  arr.reduce((acc, _, i) => (i % size ? acc : [...acc, arr.slice(i, i + size)]), []);

export default function ProductCarousel({ title = "Super Deals", products = [] }) {
  const list = (Array.isArray(products) ? products : []).filter(Boolean);

  // put deals/badged first if present
  const sorted = [...list].sort((a, b) => {
    const af = a?.badge || a?.isDeal ? 1 : 0;
    const bf = b?.badge || b?.isDeal ? 1 : 0;
    return bf - af;
  });

  const slides = chunk(sorted, 5);

  return (
    <Container className="py-4">
      <h2 className="fs-3 m-0 mb-2">{title}</h2>

      {/* Desktop: 5-up carousel */}
      <div className="d-none d-lg-block">
        <Carousel
          className="product-carousel"
          indicators={false}
          nextIcon={<span aria-hidden="true" className="text-dark fs-2">›</span>}
          prevIcon={<span aria-hidden="true" className="text-dark fs-2">‹</span>}
        >
          {slides.map((group, slideIdx) => (
            <Carousel.Item key={slideIdx}>
              <motion.div className="five-up" variants={containerStagger} initial={false} animate="show">
                {group.map((p, i) => (
                  <motion.div className="item" key={p?.id || p?.slug || `${slideIdx}-${i}`} variants={itemFade}>
                    {/* ✅ pass the whole product object */}
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </motion.div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {/* Mobile: horizontal scroll lane */}
      <div className="product-carousel d-lg-none">
        <motion.div className="scroll-lane" variants={containerStagger} initial={false} animate="show">
          {list.map((p, i) => (
            <motion.div className="scroll-card" key={p?.id || p?.slug || i} variants={itemFade}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Container>
  );
}
