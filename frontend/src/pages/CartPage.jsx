// src/pages/CartPage.jsx - REPLACE ENTIRE FILE
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Minus, Plus, Trash2, Heart, ShoppingCart } from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import CheckoutSteps from "../components/CheckoutSteps";

import { useCart } from "../context/CartContext";
import allProducts from "../data/products.js";
import "./CartPage.css";

export default function CartPage() {
  const { items, setQty, remove, clear, count } = useCart();
  const [cartRows, setCartRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Load product details
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);

      try {
        const entries = Object.entries(items).filter(([, q]) => (Number(q) || 0) > 0);
        if (!entries.length) {
          if (!cancelled) setCartRows([]);
          return;
        }

        const productRows = entries.map(([productId, qty]) => {
          let product = allProducts?.find(p =>
            String(p.id) === String(productId) ||
            String(p.slug) === String(productId)
          );

          if (!product) {
            product = {
              id: productId,
              title: `Product ${productId}`,
              subtitle: "Produkt beskrivning",
              brand: "Unknown",
              price: 299,
              image: "/images/placeholder.png",
              inStock: true,
              category: "chargers"
            };
          }

          return {
            ...product,
            qty: Math.max(0, Math.floor(Number(qty) || 0)),
            price: Number(product.price) || 0,
            subtitle: product.subtitle || product.description || "Produktbeskrivning"
          };
        });

        if (!cancelled) setCartRows(productRows);

      } catch (e) {
        if (!cancelled) setErr(e.message || "Något gick fel vid hämtning.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [items]);

  // Calculate detailed totals
  const totals = useMemo(() => {
    const totalItems = cartRows.reduce((sum, item) => sum + item.qty, 0);
    const totalMRP = cartRows.reduce((sum, item) => sum + ((item.oldPrice || item.price) * item.qty), 0);
    const discountAmount = cartRows.reduce((sum, item) => {
      const discount = item.oldPrice ? (item.oldPrice - item.price) * item.qty : 0;
      return sum + discount;
    }, 0);
    const subtotal = cartRows.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const deliveryCharges = subtotal > 500 ? 0 : 49;
    const gst = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + deliveryCharges + gst;

    return {
      totalItems,
      totalMRP,
      discountAmount,
      subtotal,
      deliveryCharges,
      gst,
      total
    };
  }, [cartRows]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('sv-SE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleQuantityChange = (productId, newQty) => {
    const qty = Math.max(0, Math.floor(Number(newQty) || 0));
    if (qty === 0) {
      remove(productId);
    } else {
      setQty(productId, qty);
    }
  };

  // Empty cart state
  if (!cartRows.length && !loading) {
    return (
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <div className="refined-cart-container">
            <div className="empty-state">
              <ShoppingCart size={64} className="empty-icon" />
              <h2>Din kundvagn är tom</h2>
              <p>Lägg till några produkter för att komma igång</p>
              <Link to="/" className="continue-btn">Fortsätt handla</Link>
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
        <div className="refined-cart-container">
          {/* Progress Steps */}
          <CheckoutSteps currentStep={1} />

          {/* Main Content */}
          <div className="cart-content">
            {/* Left Column - Cart Items */}
            <div className="cart-section">
              <div className="section-header">
                <h1>01. Min kundvagn</h1>
                <div className="item-count">{count} artikel{count !== 1 ? 'er' : ''}</div>
              </div>

              {err && (
                <div className="error-message">
                  <p>{err}</p>
                </div>
              )}

              <div className="cart-items">
                {cartRows.map((item) => (
                  <div key={item.id} className="cart-item">
                    <div className="item-image">
                      <img
                        src={item.image || item.images?.[0] || "/images/placeholder.png"}
                        alt={item.title || item.name}
                        onError={(e) => {
                          e.target.src = "/images/placeholder.png";
                        }}
                      />
                    </div>

                    <div className="item-details">
                      <h3 className="item-title">{item.title || item.name}</h3>
                      <p className="item-subtitle">{item.subtitle}</p>

                      <div className="item-controls">
                        <div className="quantity-wrapper">
                          <label>Quantity</label>
                          <div className="quantity-controls">
                            <button
                              className="qty-btn"
                              onClick={() => handleQuantityChange(item.id, item.qty - 1)}
                              disabled={loading}
                            >
                              <Minus size={16} />
                            </button>
                            <span className="qty-display">{item.qty.toString().padStart(2, '0')}</span>
                            <button
                              className="qty-btn"
                              onClick={() => handleQuantityChange(item.id, item.qty + 1)}
                              disabled={loading}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="item-price">
                      <span className="price-amount">{formatPrice(item.price * item.qty)} kr</span>
                      {item.oldPrice && (
                        <span className="original-price">{formatPrice(item.oldPrice * item.qty)} kr</span>
                      )}
                    </div>

                    <div className="item-actions">
                      <button className="action-btn wishlist-btn">
                        <Heart size={18} />
                      </button>
                      <button
                        className="action-btn remove-btn"
                        onClick={() => remove(item.id)}
                        disabled={loading}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Price Details */}
            <div className="price-section">
              <h2 className="price-title">Prisdetaljer</h2>

              <div className="price-breakdown">
                <div className="price-row">
                  <span>Totalt antal artiklar</span>
                  <span>{totals.totalItems}</span>
                </div>

                <div className="price-row">
                  <span>Totalt MRP-värde</span>
                  <span>{formatPrice(totals.totalMRP)} kr</span>
                </div>

                {totals.discountAmount > 0 && (
                  <div className="price-row discount">
                    <span>Rabatt på MRP</span>
                    <span className="discount-amount">{formatPrice(totals.discountAmount)} kr</span>
                  </div>
                )}

                <div className="price-row">
                  <span>Delsumma</span>
                  <span>{formatPrice(totals.subtotal)} kr</span>
                </div>

                <div className="price-row">
                  <span>Leveransavgifter</span>
                  <span className={totals.deliveryCharges === 0 ? 'free-delivery' : ''}>
                    {totals.deliveryCharges === 0 ? 'GRATIS' : `${formatPrice(totals.deliveryCharges)} kr`}
                  </span>
                </div>

                <div className="price-row">
                  <span>Moms</span>
                  <span>{formatPrice(totals.gst)} kr</span>
                </div>

                <div className="price-row total">
                  <span>Totalsumma</span>
                  <span>{formatPrice(totals.total)} kr</span>
                </div>
              </div>

              <Link to="/delivery" className="checkout-btn text-center text-decoration-none d-block">
                Fortsätt till leverans
              </Link>

              <div className="savings-note">
                {totals.discountAmount > 0 && (
                  <p>Du sparar {formatPrice(totals.discountAmount)} kr på denna beställning!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}