// Carousel.jsx (ControlledCarousel)
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Carousel from "react-bootstrap/Carousel";

export default function ControlledCarousel() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className="position-relative"
    >
      <Carousel interval={4000} controls indicators fade>
        <Carousel.Item>
          <img
            className="d-block w-100"
            src="src/assets/central_homepage/central3.webp"
            alt="Första bilden"
          />
          <Carousel.Caption>
            <h3>Stor rea</h3>
            <p>Handla elektronik till bästa pris</p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item>
          <img
            className="d-block w-100"
            src="src/assets/central_homepage/central2.webp"
            alt="Andra bilden"
          />
          <Carousel.Caption>
            <h3>Nyheter</h3>
            <p>Upptäck de senaste produkterna</p>
          </Carousel.Caption>
        </Carousel.Item>

        <Carousel.Item>
          <img
            className="d-block w-100"
            src="src/assets/central_homepage/central.avif"
            alt="Tredje bilden"
          />
          <Carousel.Caption>
            <h3>Populära produkter</h3>
            <p>Se vad andra kunder älskar just nu</p>
          </Carousel.Caption>
        </Carousel.Item>
      </Carousel>
    </motion.div>
  );
}
