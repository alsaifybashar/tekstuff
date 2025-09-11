// src/pages/CartPage.jsx - COMPLETE REPLACEMENT
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, Heart } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";

import { useCart } from "../context/CartContext";
import allProducts from "../data/products.js"; // Your existing products
import "./CartPage.css";

const kr = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 });

export default function CartPage() {
  const { items, setQty, remove, clear, count } = useCart();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Load product details for current cart
  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      setLoading(true);
      setErr(null);
      
      try {
        const entries = Object.entries(items).filter(([, q]) => (Number(q) || 0) > 0);
        if (!entries.length) {
          if (!cancelled) setRows([]);
          return;
        }

        const productRows = entries.map(([productId, qty]) => {
          // Find product in your data
          let product = allProducts?.find(p => 
            String(p.id) === String(productId) || 
            String(p.slug) === String(productId)
          );

          if (!product) {
            // Fallback product
            product = {
              id: productId,
              title: `Product ${productId}`,
              price: 299,
              image: "/images/placeholder.png",
              brand: "Unknown",
              inStock: true
            };
          }

          return {
            ...product,
            qty: Math.max(0, Math.floor(Number(qty) || 0)),
            price: Number(product.price) || 0
          };
        });

        if (!cancelled) setRows(productRows);
        
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
    const vat = Math.round(subtotal * 0.2); // 20% Swedish VAT
    return { subtotal, vat };
  }, [rows]);

  const fmt = (n) => `${kr.format(Math.round(Number(n) || 0))}:-`;

  const handleQuantityChange = (productId, newQty) => {
    const qty = Math.max(0, Math.floor(Number(newQty) || 0));
    if (qty === 0) {
      remove(productId);
    } else {
      setQty(productId, qty);
    }
  };

  // Empty cart UI
  if (!rows.length && !loading) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <div className="cart-container">
            <div className="cart-header">
              <Link to="/" className="back-button">
                <ArrowLeft size={20} />
                Fortsätt handla
              </Link>
              <h1>DIN KUNDVAGN (0 PRODUKTER)</h1>
            </div>
            <div className="empty-cart">
              <p>Din kundvagn är tom</p>
              <Link to="/" className="btn btn-primary">Fortsätt handla</Link>
            </div>
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
        <div className="cart-container">
          {/* Header */}
          <div className="cart-header">
            <Link to="/" className="back-button">
              <ArrowLeft size={20} />
              Fortsätt handla
            </Link>
            <div className="header-actions">
              <h1>DIN KUNDVAGN ({count} PRODUKT{count !== 1 ? 'ER' : ''})</h1>
              <button className="checkout-button-header">
                Fortsätt till kassan
              </button>
            </div>
          </div>

          {err && (
            <div className="alert alert-danger mb-3">{err}</div>
          )}

          <div className="cart-content">
            {/* Cart Items */}
            <div className="cart-items">
              {rows.map((item) => (
                <div key={item.id} className="cart-item">
                  {/* Product Image */}
                  <div className="item-image">
                    <img 
                      src={item.image || item.images?.[0] || "/images/placeholder.png"} 
                      alt={item.title || item.name} 
                    />
                  </div>

                  {/* Product Info */}
                  <div className="item-info">
                    <h3 className="item-title">{item.title || item.name}</h3>
                    <div className="item-status">
                      <span className="status-dot"></span>
                      <span className="status-text">I lager</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="quantity-controls">
                    <button 
                      className="qty-button"
                      onClick={() => handleQuantityChange(item.id, item.qty - 1)}
                      aria-label="Minska antal"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="qty-display">{item.qty}</span>
                    <button 
                      className="qty-button"
                      onClick={() => handleQuantityChange(item.id, item.qty + 1)}
                      aria-label="Öka antal"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="item-price">
                    {fmt(item.price)}
                  </div>

                  {/* Actions */}
                  <div className="item-actions">
                    <button className="action-button wishlist-button">
                      <Heart size={16} />
                    </button>
                    <button 
                      className="action-button remove-button"
                      onClick={() => remove(item.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Sidebar */}
            <div className="order-summary">
              {/* Member Benefits */}
              <div className="member-benefits">
                <h3>FÅ MER SOM MEDLEM</h3>
                <ul>
                  <li>Exklusiva klubbdeals & rabatter</li>
                  <li>100 kr presentkort för köp över 5000 kr</li>
                  <li>Förtur till kampanjer & Black Friday</li>
                </ul>
                <button className="login-button">
                  Logga in / Registrera dig
                </button>
              </div>

              {/* Order Overview */}
              <div className="order-overview">
                <div className="overview-tabs">
                  <button className="tab active">Orderöversikt</button>
                  <button className="tab">Delbetalning</button>
                </div>

                <div className="summary-line">
                  <span>Leveransmetod</span>
                  <span>Pris visas i kassan</span>
                </div>

                <div className="summary-line">
                  <span>Moms</span>
                  <span>{fmt(totals.vat)}</span>
                </div>

                <div className="total-line">
                  <span className="total-label">Totalbelopp SEK</span>
                  <span className="total-amount">{fmt(totals.subtotal)}</span>
                </div>

                <button className="checkout-button">
                  Fortsätt till kassan
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}