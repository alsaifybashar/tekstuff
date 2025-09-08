import { useMemo } from "react";
import { Link } from "react-router-dom";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { useCart } from "../context/CartContext";
import { getProductById } from "../services/catalog";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";


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
    id: "hp-15",
    image: "src/assets/dator.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },

  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/charger/laddare1.webp",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/tvattmaskin.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "src/assets/tv.avif",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490:-",
    oldPrice: "9995:-",
  },
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
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
    return { subtotal };
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

      <main className="flex-grow-1">
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="h4 m-0">Kundvagn</h1>
            <Button variant="outline-danger" onClick={() => clear()}>
              Töm kundvagnen
            </Button>
          </div>

          <Table responsive bordered hover className="align-middle">
            <thead>
              <tr>
                <th>Produkt</th>
                <th style={{ width: 120 }}>Pris</th>
                <th style={{ width: 140 }}>Antal</th>
                <th style={{ width: 140 }}>Summa</th>
                <th style={{ width: 70 }} aria-label="Ta bort" />
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td className="d-flex gap-3 align-items-center">
                    <img src={row.image} alt="" width="64" height="64" style={{ objectFit: "cover" }} />
                    <div>
                      <div className="fw-semibold">{row.title}</div>
                      <div className="text-muted small">{row.brand}</div>
                    </div>
                  </td>
                  <td>{row.price} kr</td>
                  <td>
                    <Form.Control
                      type="number"
                      min={0}
                      value={row.qty}
                      onChange={(e) => {
                        const v = Math.max(0, Math.floor(+e.target.value || 0));
                        setQty(row.id, v);
                      }}
                    />
                  </td>
                  <td>{row.price * row.qty} kr</td>
                  <td>
                    <Button variant="outline-secondary" size="sm" onClick={() => remove(row.id)}>
                      Ta bort
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-end">
            <div className="border rounded p-3" style={{ minWidth: 320 }}>
              <div className="d-flex justify-content-between">
                <span className="fw-semibold">Delsumma</span>
                <span>{totals.subtotal} kr</span>
              </div>
              <div className="text-muted small mt-1">
                Frakt och moms tillkommer i nästa steg.
              </div>
              <Button variant="primary" className="w-100 mt-3" style={{ paddingLeft: "2rem" }}>
                Till kassan
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
