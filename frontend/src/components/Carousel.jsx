// Carousel.jsx
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Carousel from "react-bootstrap/Carousel";

// ✅ Import assets so Vite emits them to /assets/* in the build
import central3 from "../assets/central3.webp";
import central2 from "../assets/central2.webp";
import central from "../assets/central.avif";

export default function ControlledCarousel() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  return (
    <motion.div ref={ref} style={{ y, opacity }} className="position-relative">
      <Carousel interval={4000} controls indicators fade>
        <Carousel.Item>
          <img className="d-block w-100" src={central3} alt="Första bilden" loading="eager" decoding="async" />
          <Carousel.Caption>
            <h3>Stor rea</h3>
            <p>Handla elektronik till bästa pris</p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item>
          <img className="d-block w-100" src={central2} alt="Andra bilden" loading="lazy" decoding="async" />
          <Carousel.Caption>
            <h3>Nyheter</h3>
            <p>Upptäck de senaste produkterna</p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item>
          <img className="d-block w-100" src={central} alt="Tredje bilden" loading="lazy" decoding="async" />
          <Carousel.Caption>
            <h3>Populära produkter</h3>
            <p>Se vad andra kunder älskar just nu</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>
    </motion.div>
  );
}
