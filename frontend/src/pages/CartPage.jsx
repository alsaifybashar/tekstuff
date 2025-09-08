// src/pages/CartPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";

import { useCart } from "../context/CartContext";
import { api } from "../services/api";

// Optional: fallback carousel data (until you wire a "popular" endpoint)
const fallbackDeals = [
  {
    badge: "SUPER DEAL",
    id: "hp-15",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6”",
    subtitle: "Finns i andra varianter",
    price: "5490",
    oldPrice: "9995",
  },
  {
    badge: "SUPER DEAL",
    id: "anker-65w",
    image: "/images/charger/laddare1.webp",
    title: "Anker PowerPort III 65W Charger",
    subtitle: "Snabbladdare",
    price: "499",
    oldPrice: "699",
  },
];

const kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart(); // items: { [productId]: qty }
  const [rows, setRows] = useState([]);               // rows: [{...product, qty, price:number}]
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Load product details for current cart (parallel + dedupe)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true); setErr(null);
      try {
        const entries = Object.entries(items).filter(([, q]) => (Number(q) || 0) > 0);
        if (!entries.length) { if (!cancelled) setRows([]); return; }
        const ids = [...new Set(entries.map(([id]) => id))];
        const products = await api.getProductsBatch(ids);           // 👈 one backend call
        const map = new Map(products.map((p) => [p.id, p]));
        const next = entries.map(([id, qty]) => {
          const p = map.get(id); if (!p) return null;
          return { ...p, qty: Math.max(0, Math.floor(Number(qty) || 0)) };
        }).filter(Boolean);
        if (!cancelled) setRows(next);
      } catch (e) {
        if (!cancelled) setErr(e.message || "Något gick fel vid hämtning.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [items]);


  const totals = useMemo(() => {
    const subtotal = rows.reduce(
      (sum, r) => sum + (Number(r.price) || 0) * (Number(r.qty) || 0),
      0
    );
    return { subtotal };
  }, [rows]);

  const fmt = (n) => `${kr.format(Math.round(Number(n) || 0))} kr`;

  // Empty cart UI (keeps your design)
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
            <ProductCarousel title="Populära produkter" products={fallbackDeals} />
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
            <Button variant="outline-danger" onClick={clear} disabled={loading}>
              Töm kundvagnen
            </Button>
          </div>

          {err ? (
            <Alert variant="danger" className="mb-3">
              {err}
            </Alert>
          ) : null}

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
              {rows.map((row) => {
                const lineTotal = (Number(row.price) || 0) * (Number(row.qty) || 0);
                return (
                  <tr key={row.id}>
                    <td className="d-flex gap-3 align-items-center">
                      <img
                        src={row.image || row.images?.[0]}
                        alt={row.title || row.name || "Produkt"}
                        width="64"
                        height="64"
                        style={{ objectFit: "cover" }}
                        loading="lazy"
                      />
                      <div>
                        <div className="fw-semibold">{row.title || row.name || "Produkt"}</div>
                        {row.brand ? <div className="text-muted small">{row.brand}</div> : null}
                      </div>
                    </td>

                    <td>{fmt(row.price)}</td>

                    <td>
                      <Form.Control
                        type="number"
                        min={0}
                        value={row.qty}
                        disabled={loading}
                        onChange={(e) => {
                          const v = Math.max(0, Math.floor(Number(e.target.value) || 0));
                          setQty(row.id, v);
                        }}
                        aria-label={`Antal för ${row.title || row.name || row.id}`}
                      />
                    </td>

                    <td>{fmt(lineTotal)}</td>

                    <td>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => remove(row.id)}
                        disabled={loading}
                      >
                        Ta bort
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          <div className="d-flex justify-content-end">
            <div className="border rounded p-3" style={{ minWidth: 320 }}>
              <div className="d-flex justify-content-between">
                <span className="fw-semibold">Delsumma</span>
                <span>{fmt(totals.subtotal)}</span>
              </div>
              <div className="text-muted small mt-1">
                Frakt och moms tillkommer i nästa steg.
              </div>
              <Button
                variant="primary"
                className="w-100 mt-3"
                style={{ paddingLeft: "2rem" }}
                disabled={loading}
              >
                {loading ? "Uppdaterar..." : "Till kassan"}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
