import { useMemo } from "react";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { useCart } from "../context/CartContext";
import { getProductById } from "../services/catalog";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";
import { Plus, Minus, Trash2 } from "lucide-react";
import './CartPage.css';




const deals = [
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/react.svg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6″",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/dator.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6″",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/charger/laddare1.webp",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6″",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/tvattmaskin.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6″",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/tv.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6″",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
];

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart();

  const rows = useMemo(() => {
    return Object.entries(items).map(([id, qty]) => {
      const p = getProductById(id);
      return p ? { ...p, qty } : null;
    }).filter(Boolean);
  }, [items]);

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, r) => sum + r.price * r.qty, 0);
    const vat = Math.round(subtotal * 0.20); // 20% Swedish VAT
    const total = subtotal;
    return { subtotal, vat, total };
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <div className="container py-5 text-center">
            <img
              src="/images/empty-cart.png"
              alt="Tom kundvagn"
              className="img-fluid mb-4"
              style={{ maxWidth: "320px", opacity: 0.9 }}
            />
            <h2 className="h4 mb-3">Din kundvagn är tom</h2>
            <p className="text-muted mb-4">Du har inte lagt till några produkter ännu.</p>
            <Button as={Link} to="/" variant="primary" size="lg">
              Fortsätt handla
            </Button>
          </div>
          <div className="container">
            <ProductCarousel title="Populära produkter" products={deals} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      
      <main className="flex-grow-1 bg-light">
        <Container fluid="xl" className="py-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-1">DIN KUNDVAGN ({rows.length} PRODUKTER)</h1>
              <small className="text-muted">ID: 1669461122</small>
            </div>
            <div className="d-flex gap-2">
              <Button 
                as={Link} 
                to="/" 
                variant="outline-secondary"
                className="d-flex align-items-center gap-2"
              >
                ← Fortsätt handla
              </Button>
              <Button 
                variant="success"
                size="lg"
                className="px-4"
              >
                Fortsätt till kassan
              </Button>
            </div>
          </div>

          <Row className="g-4">
            {/* Cart Items */}
            <Col lg={8}>
              <div className="bg-white rounded-3 shadow-sm">
                {rows.map((row, index) => (
                  <div 
                    key={row.id} 
                    className={`d-flex align-items-center p-4 ${
                      index !== rows.length - 1 ? 'border-bottom' : ''
                    }`}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0 me-3">
                      <img 
                        src={row.image} 
                        alt={row.title}
                        width="80" 
                        height="80" 
                        className="rounded"
                        style={{ objectFit: "contain", backgroundColor: "#f8f9fa" }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-grow-1 me-3">
                      <h6 className="mb-1 fw-semibold">{row.title}</h6>
                      <div className="d-flex align-items-center gap-1 text-success small">
                        <span className="rounded-circle bg-success" style={{ width: "8px", height: "8px" }}></span>
                        I lager
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="d-flex align-items-center gap-3 me-4">
                      <div className="d-flex align-items-center border rounded">
                        <Button
                          variant="link"
                          size="sm"
                          className="border-0 text-dark p-2"
                          onClick={() => setQty(row.id, Math.max(0, row.qty - 1))}
                          style={{ lineHeight: 1 }}
                        >
                          <Minus size={16} />
                        </Button>
                        <span className="px-3 py-1 border-start border-end" style={{ minWidth: "50px", textAlign: "center" }}>
                          {row.qty}
                        </span>
                        <Button
                          variant="link"
                          size="sm"
                          className="border-0 text-dark p-2"
                          onClick={() => setQty(row.id, row.qty + 1)}
                          style={{ lineHeight: 1 }}
                        >
                          <Plus size={16} />
                        </Button>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="text-danger p-1"
                        onClick={() => remove(row.id)}
                        aria-label="Ta bort produkt"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>

                    {/* Price */}
                    <div className="text-end">
                      <div className="fw-bold fs-5">{row.price * row.qty}:-</div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>

            {/* Order Summary */}
            <Col lg={4}>
              {/* Member Benefits */}
              <div className="bg-warning bg-opacity-10 rounded-3 p-4 mb-4 border border-warning border-opacity-25">
                <div className="fw-semibold mb-2">
                  FÅ MER SOM <span className="text-success">MEDLEM</span>
                </div>
                <ul className="small mb-3 ps-3">
                  <li>Exklusiva klubbdeals & rabatter</li>
                  <li>100 kr presentkort för köp över 5000 kr</li>
                  <li>Förtur till kampanjer & Black Friday</li>
                </ul>
                <Button variant="success" className="w-100" size="sm">
                  Logga in / Registrera dig
                </Button>
              </div>

              {/* Order Summary */}
              <div className="bg-white rounded-3 shadow-sm p-4">
                <div className="d-flex justify-content-between mb-3">
                  <span className="fw-semibold">Orderöversikt</span>
                  <div className="text-end">
                    <div className="fw-semibold">Delbetalning</div>
                    <small className="text-muted">Pris visas i kassan</small>
                  </div>
                </div>

                <hr />

                <div className="d-flex justify-content-between mb-2">
                  <span>Leveransmetod</span>
                  <span>Pris visas i kassan</span>
                </div>
                
                <div className="d-flex justify-content-between mb-3">
                  <span>Moms</span>
                  <span>{totals.vat.toFixed(2)}</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="text-muted">Totalbelopp SEK</span>
                  <span className="fs-2 fw-bold">{totals.total}:-</span>
                </div>

                <Button 
                  variant="success" 
                  size="lg" 
                  className="w-100"
                >
                  Fortsätt till kassan
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </main>
      
      <Footer />
    </div>
  );
}