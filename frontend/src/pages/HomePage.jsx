import Navbar from "../components/Navbar";
import CategoryStrip from "../components/CategoryStrip";
import ControlledCarousel from "../components/Carousel";
import Container from "react-bootstrap/Container";
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Footer from "../components/Footer/Footer";
import { motion } from "framer-motion";
import TopBanner from "../components/TopBanner"; // Importing TopBanner component

const deals = [
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/react.svg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },

  {
    badge: "SUPER DEAL",
    id: "hp-16",
    image: "src/assets/dator.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },

  {
    badge: "SUPER DEAL",
    id: "hp-17",
    image: "src/assets/charger/laddare1.webp",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-18",
    image: "src/assets/tvattmaskin.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-19",
    image: "src/assets/tv.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-20",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-151",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-154",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-155",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15123",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
];

function HomePage() {
  return (
    <>
      <TopBanner
        message="Missa inte våra Flash Deals!"
        href="/flash-deals"
        linkLabel="Klicka här"
        endsAtISO="2025-09-10T21:00:00Z"
        colorClass="bg-primary"
      />
      <Navbar />


      {/* page spacing */}
      <div style={{ height: "2rem" }} />

      <CategoryStrip onSelect={(id) => console.log("Selected:", id)} />

      <Container className="py-3">
        <Row className="justify-content-center">
          <Col xs={40} md={40} lg={40} xl={40}>
            <div className="shadow rounded-4 overflow-hidden">
              <ControlledCarousel />
            </div>
          </Col>
        </Row>
      </Container>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <ProductCarousel title="Super Deals" products={deals} />
      </motion.div>

      <br></br>
      <hr class="w-25 mx-auto my-4"></hr>
      <ProductCarousel title="Nyheter" products={deals} />

      <br></br>
      <hr class="w-25 mx-auto my-4"></hr>
      <ProductCarousel title="Populära produkter" products={deals} />

      <Footer />
    </>
  );
}

export default HomePage;
