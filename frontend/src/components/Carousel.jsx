// src/components/UncontrolledExample.jsx
import Carousel from "react-bootstrap/Carousel";

const slides = [
  { src: "src/assets/image1.avif", alt: "Featured product one", captionH: "First slide label", captionP: "Nulla vitae elit libero, a pharetra augue mollis interdum." },
  { src: "src/assets/image1.avif", alt: "Featured product two", captionH: "Second slide label", captionP: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { src: "src/assets/mac.webp", alt: "Featured product three", captionH: "Third slide label", captionP: "Praesent commodo cursus magna, vel scelerisque nisl consectetur." },
];

export default function UncontrolledExample() {
  return (
    <Carousel>
      {slides.map((s, i) => (
        <Carousel.Item key={s.src}>
          <img
            src={s.src}
            alt={s.alt}
            className="d-block w-100"
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
            sizes="(min-width: 992px) 960px, 100vw"
            fetchpriority={i === 0 ? "high" : "auto"}
          />
          <Carousel.Caption>
            <h3>{s.captionH}</h3>
            <p>{s.captionP}</p>
          </Carousel.Caption>
        </Carousel.Item>
      ))}
    </Carousel>
  );
}
