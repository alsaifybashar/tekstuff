// src/pages/CartPage.jsx - FIXED VERSION
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";

import { useCart } from "../context/CartContext";

// Import your local products data as fallback
import allProducts from "../data/products.js";

// Optional: fallback carousel data
const fallbackDeals = [
  {
    badge: "SUPER DEAL",
    id: "hp-15-fallback",
    image: "/images/hp15.jpg",
    title: "HP Laptop 15-fc0828no R5-7520U/16/512 15.6″",
    subtitle: "Finns i andra varianter",
    price: "5490",
    oldPrice: "9995",
  },
];

const kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

export default function CartPage() {
  const { items, setQty, remove, clear, count } = useCart();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  console.log('CartPage - Cart items:', items);
  console.log('CartPage - Cart count:', count);
  console.log('CartPage - Available products:', allProducts?.length || 0);

  // Load product details for current cart items
  useEffect(() => {
    let cancelled = false;
    
    async function loadCartProducts() {
      if (!items || typeof items !== 'object') {
        console.log('No cart items found');
        if (!cancelled) setRows([]);
        return;
      }

      setLoading(true);
      setErr(null);

      try {
        // Get entries where quantity > 0
        const entries = Object.entries(items).filter(([, qty]) => (Number(qty) || 0) > 0);
        console.log('Cart entries to load:', entries);
        
        if (!entries.length) {
          if (!cancelled) setRows([]);
          return;
        }

        // Try to get products from your local data first
        const productRows = [];
        
        for (const [productId, qty] of entries) {
          console.log(`Looking for product ID: ${productId}`);
          
          // Try to find product in your local data
          let product = allProducts?.find(p => 
            p.id === productId || 
            p.slug === productId ||
            String(p.id) === String(productId)
          );

          if (!product) {
            console.warn(`Product not found for ID: ${productId}`);
            // Create a fallback product object
            product = {
              id: productId,
              title: `Product ${productId}`,
              name: `Product ${productId}`,
              price: 0,
              image: "/images/placeholder.png",
              brand: "Unknown",
              inStock: true
            };
          }

          // Add quantity to the product
          const productWithQty = {
            ...product,
            qty: Math.max(0, Math.floor(Number(qty) || 0)),
            // Ensure price is a number
            price: Number(product.price) || 0
          };

          console.log('Loaded product:', productWithQty);
          productRows.push(productWithQty);
        }

        if (!cancelled) {
          console.log('Setting cart rows:', productRows);
          setRows(productRows);
        }

      } catch (error) {
        console.error('Error loading cart products:', error);
        if (!cancelled) {
          setErr(error.message || "Något gick fel vid hämtning av produkter.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCartProducts();
    return () => { cancelled = true; };
  }, [items]);

  const totals = useMemo(() => {
    const subtotal = rows.reduce(
      (sum, row) => sum + (Number(row.price) || 0) * (Number(row.qty) || 0),
      0
    );
    return { subtotal };
  }, [rows]);

  const fmt = (n) => `${kr.format(Math.round(Number(n) || 0))} kr`;

  // Handle quantity changes
  const handleQtyChange = (productId, newQty) => {
    const qty = Math.max(0, Math.floor(Number(newQty) || 0));
    console.log(`Updating quantity for ${productId}: ${qty}`);
    setQty(productId, qty);
  };

  // Handle product removal
  const handleRemove = (productId) => {
    console.log(`Removing product: ${productId}`);
    remove(productId);
  };

  // Debug information (remove in production)
  const debugInfo = (
    <div className="alert alert-info small mb-3">
      <strong>Debug Info:</strong><br/>
      Cart items: {JSON.stringify(items)}<br/>
      Cart count: {count}<br/>
      Loaded rows: {rows.length}<br/>
      Available products: {allProducts?.length || 0}
    </div>
  );

  // Empty cart UI
  if (!loading && !err && (!rows.length || count === 0)) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <div className="container py-5 text-center">
            {/* Debug info for troubleshooting */}
            {process.env.NODE_ENV === 'development' && debugInfo}
            
            <img
              src="/images/empty-cart.png"
              alt="Tom kundvagn"
              className="img-fluid mb-4"
              style={{ maxWidth: "320px", opacity: 0.9 }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
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
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && debugInfo}

          <div className="d-flex justify-content-between align-items-center mb-3">
            <h1 className="h4 m-0">Kundvagn ({count} artikel{count === 1 ? '' : 'er'})</h1>
            <Button variant="outline-danger" onClick={clear} disabled={loading}>
              Töm kundvagnen
            </Button>
          </div>

          {err && (
            <Alert variant="danger" className="mb-3">
              {err}
            </Alert>
          )}

          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Laddar produkter...</span>
              </Spinner>
              <p className="mt-2 text-muted">Laddar dina produkter...</p>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <>
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
                    const productName = row.title || row.name || "Produkt";
                    const productImage = row.image || row.images?.[0] || "/images/placeholder.png";
                    
                    return (
                      <tr key={row.id}>
                        <td className="d-flex gap-3 align-items-center">
                          <img
                            src={productImage}
                            alt={productName}
                            width="64"
                            height="64"
                            style={{ objectFit: "cover" }}
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = "/images/placeholder.png";
                            }}
                          />
                          <div>
                            <div className="fw-semibold">{productName}</div>
                            {row.brand && <div className="text-muted small">{row.brand}</div>}
                            {process.env.NODE_ENV === 'development' && (
                              <small className="text-muted">ID: {row.id}</small>
                            )}
                          </div>
                        </td>

                        <td>{fmt(row.price)}</td>

                        <td>
                          <Form.Control
                            type="number"
                            min={0}
                            value={row.qty}
                            disabled={loading}
                            onChange={(e) => handleQtyChange(row.id, e.target.value)}
                            aria-label={`Antal för ${productName}`}
                          />
                        </td>

                        <td>{fmt(lineTotal)}</td>

                        <td>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleRemove(row.id)}
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
                    disabled={loading || rows.length === 0}
                  >
                    {loading ? "Uppdaterar..." : "Till kassan"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}