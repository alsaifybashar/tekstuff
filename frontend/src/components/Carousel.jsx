// src/components/UncontrolledExample.jsx
import Carousel from "react-bootstrap/Carousel";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";


const slides = [
  { src: "src/assets/image1.avif", alt: "Featured product one", captionH: "First slide label", captionP: "Nulla vitae elit libero, a pharetra augue mollis interdum." },
  { src: "src/assets/image1.avif", alt: "Featured product two", captionH: "Second slide label", captionP: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
  { src: "src/assets/mac.webp", alt: "Featured product three", captionH: "Third slide label", captionP: "Praesent commodo cursus magna, vel scelerisque nisl consectetur." },
];


export default function ControlledCarousel() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Move up slightly and fade as page scrolls
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  return (
    <motion.div ref={ref} style={{ y, opacity, willChange: "transform, opacity" }}>
      <Carousel /* your props, custom arrows */>
        {/* slides with <img className="d-block w-100" /> etc. */}
      </Carousel>
    </motion.div>
  );
}