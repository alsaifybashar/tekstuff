// src/components/ProductCarousel.jsx
import "./ProductCarousel.css";
import Carousel from "react-bootstrap/Carousel";
import Container from "react-bootstrap/Container";
import ProductCard from "../ProductCard";

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
          nextIcon={<span aria-hidden="true" className="text-dark fs-2">›</span>}
          prevIcon={<span aria-hidden="true" className="text-dark fs-2">‹</span>}
        >
          {slides.map((group, idx) => (
            <Carousel.Item key={idx}>
              <div className="five-up">
                {group.map((p) => (
                  <div className="item" key={p.id}>
                    <ProductCard {...p} />
                  </div>
                ))}
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </div>

      {/* Mobile scroll lane */}
      <div className="product-carousel d-lg-none">
        <div className="scroll-lane">
          {sorted.map((p) => (
            <div className="scroll-card" key={p.id}>
              <ProductCard {...p} />
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}