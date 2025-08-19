// src/components/ProductCarousel.jsx
import "./ProductCarousel.css";
import Carousel from "react-bootstrap/Carousel";
import Container from "react-bootstrap/Container";
import ProductCard from "../ProductCard";
import { motion } from "framer-motion";

const containerStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};
const itemFade = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

// chunk helper
const chunk = (arr, size) =>
  arr.reduce((a, _, i) => (i % size ? a : [...a, arr.slice(i, i + size)]), []);

export default function ProductCarousel({
  title = "Super Deals",
  products = [],
}) {
  // sort: items with badge first
  const sorted = [...products].sort((a, b) => {
    if (a.badge && !b.badge) return -1;
    if (!a.badge && b.badge) return 1;
    return 0;
  });

  const slides = chunk(sorted, 5); // chunk AFTER sorting

  return (
    <Container className="py-4">
      <h2 className="fs-3 m-0 mb-2">{title}</h2>

      <div className="d-none d-lg-block">
        <Carousel
          className="product-carousel"
          indicators={false}
          nextIcon={
            <span aria-hidden="true" className="text-dark fs-2">
              ›
            </span>
          }
          prevIcon={
            <span aria-hidden="true" className="text-dark fs-2">
              ‹
            </span>
          }
        >
          {slides.map((group, idx) => (
            <Carousel.Item key={idx}>
              <motion.div
                className="five-up"
                variants={containerStagger}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
              >
                {group.map((p) => (
                  <motion.div className="item" key={p.id} variants={itemFade}>
                    <ProductCard {...p} />
                  </motion.div>
                ))}
              </motion.div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {/* Mobile scroll lane */}
      <div className="product-carousel d-lg-none">
        <motion.div
          className="scroll-lane"
          variants={containerStagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          {products.map((p) => (
            <motion.div className="scroll-card" key={p.id} variants={itemFade}>
              <ProductCard {...p} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Container>
  );
}
