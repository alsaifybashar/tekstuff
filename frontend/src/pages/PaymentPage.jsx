import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Lock, Smartphone, ShieldCheck, CheckCircle } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import CheckoutSteps from "../components/CheckoutSteps";
import { useCart } from "../context/CartContext";
import allProducts from "../data/products.js";
import "./PaymentPage.css";
import "./CartPage.css";

export default function PaymentPage() {
    const navigate = useNavigate();
    const { items, count, clear } = useCart();
    const [loading, setLoading] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [success, setSuccess] = useState(false);

    // Redirect if cart empty (unless success state)
    useEffect(() => {
        if (count === 0 && !success) {
            navigate('/cart');
        }
    }, [count, success, navigate]);

    // Calculate totals (Same logic as Delivery Page - ideally typically handled via Context/API)
    const totals = useMemo(() => {
        let subtotal = 0;
        Object.entries(items).forEach(([id, qty]) => {
            const product = allProducts.find(p =>
                String(p.id) === String(id) || String(p.slug) === String(id)
            );
            if (product) {
                subtotal += (Number(product.price) || 0) * (Number(qty) || 0);
            }
        });
        // Assuming shipping was selected previously, usually stored in Context/LocalStorage.
        // For visual consistency in this mock flow, let's assume standard shipping 49kr if subtotal < 500
        const deliveryCost = subtotal > 500 ? 0 : 49;
        const total = subtotal + deliveryCost;

        return { subtotal, deliveryCost, total };
    }, [items]);

    const formatPrice = (p) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(p);

    const handlePayment = async () => {
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setSuccess(true);
            clear(); // Clear cart
            window.scrollTo(0, 0);
        }, 2000);
    };

    if (success) {
        return (
            <div className="d-flex flex-column min-vh-100">
                <Navbar />
                <main className="flex-grow-1 payment-container d-flex align-items-center justify-content-center">
                    <div className="text-center p-5 bg-white rounded-4 shadow-sm" style={{ maxWidth: '600px' }}>
                        <div className="mb-4 text-success">
                            <CheckCircle size={80} />
                        </div>
                        <h1 className="mb-3">Tack för din beställning!</h1>
                        <p className="text-muted mb-4">
                            Din betalning har mottagits och vi behandlar nu din order.
                            En orderbekräftelse har skickats till din e-post.
                        </p>
                        <div className="p-3 bg-light rounded mb-4 text-start">
                            <p className="mb-1"><strong>Ordernummer:</strong> #{Math.floor(Math.random() * 1000000)}</p>
                            <p className="mb-0"><strong>Beräknad leverans:</strong> 1-3 arbetsdagar</p>
                        </div>
                        <button className="btn btn-primary px-5 py-2" onClick={() => navigate('/')}>
                            Tillbaka till butiken
                        </button>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-grow-1 payment-container">
                <CheckoutSteps currentStep={3} />

                <div className="payment-content">
                    {/* Left Column: Payment Methods */}
                    <div className="left-column">
                        <h2 className="section-title mb-4">
                            <div className="icon-circle bg-primary-subtle text-primary p-2 rounded-circle d-inline-flex me-2">
                                <CreditCard size={20} />
                            </div>
                            Välj betalsätt
                        </h2>

                        <div className="payment-methods-grid">

                            {/* Card Payment */}
                            <div
                                className={`payment-method-card ${selectedMethod === 'card' ? 'selected' : ''}`}
                                onClick={() => setSelectedMethod('card')}
                            >
                                <div className="payment-header">
                                    <div className="radio-check"></div>
                                    <div className="method-info">
                                        <span className="method-name">Kortbetalning</span>
                                        <span className="method-desc">Säker betalning med Visa, Mastercard</span>
                                    </div>
                                    <div className="payment-logos">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="payment-logo-small" alt="Visa" />
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="payment-logo-small" alt="Mastercard" />
                                    </div>
                                </div>

                                {selectedMethod === 'card' && (
                                    <div className="payment-details">
                                        <div className="card-form">
                                            <div className="card-number-group">
                                                <label className="form-label small text-muted">Kortnummer</label>
                                                <div className="position-relative">
                                                    <input type="text" className="form-control" placeholder="0000 0000 0000 0000" />
                                                    <div className="card-icon-overlay">
                                                        <Lock size={14} className="text-muted" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="form-label small text-muted">Utgångsdatum</label>
                                                <input type="text" className="form-control" placeholder="MM / ÅÅ" />
                                            </div>
                                            <div>
                                                <label className="form-label small text-muted">CVC</label>
                                                <input type="text" className="form-control" placeholder="123" />
                                            </div>
                                            <div className="card-number-group mt-2">
                                                <label className="form-label small text-muted">Kortinnehavare</label>
                                                <input type="text" className="form-control" placeholder="Namn på kortet" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Swish */}
                            <div
                                className={`payment-method-card ${selectedMethod === 'swish' ? 'selected' : ''}`}
                                onClick={() => setSelectedMethod('swish')}
                            >
                                <div className="payment-header">
                                    <div className="radio-check"></div>
                                    <div className="method-info">
                                        <span className="method-name">Swish</span>
                                        <span className="method-desc">Betala enkelt med din mobil</span>
                                    </div>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/22/Swish_Logo.png" className="payment-logo-small" alt="Swish" style={{ height: 30 }} />
                                </div>

                                {selectedMethod === 'swish' && (
                                    <div className="payment-details">
                                        <div className="swish-form">
                                            <label className="form-label small text-muted">Mobilnummer</label>
                                            <div className="swish-input-group">
                                                <span className="prefix">+46</span>
                                                <input type="tel" className="swish-input" placeholder="70 123 45 67" />
                                            </div>
                                            <p className="small text-muted mt-2 mb-0">Öppna Swish-appen i din mobil och godkänn betalningen.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Klarna */}
                            <div
                                className={`payment-method-card ${selectedMethod === 'klarna' ? 'selected' : ''}`}
                                onClick={() => setSelectedMethod('klarna')}
                            >
                                <div className="payment-header">
                                    <div className="radio-check"></div>
                                    <div className="method-info">
                                        <span className="method-name">
                                            Klarna
                                            <span className="klarna-badge">Smoooth</span>
                                        </span>
                                        <span className="method-desc">Få först. Betala sen.</span>
                                    </div>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c2/Klarna_Logo_black.svg" className="payment-logo-small" alt="Klarna" />
                                </div>
                                {/* No fields needed for mock, typically redirects or iframe */}
                            </div>

                        </div>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="right-column summary-panel">
                        <div className="price-section">
                            <h2 className="price-title">Kassa</h2>

                            <div className="price-breakdown">
                                <div className="price-row">
                                    <span>Totalt varor</span>
                                    <span>{formatPrice(totals.subtotal)} kr</span>
                                </div>
                                <div className="price-row">
                                    <span>Frakt</span>
                                    <span>{totals.deliveryCost === 0 ? 'Fri frakt' : `${totals.deliveryCost} kr`}</span>
                                </div>
                                <div className="price-row total mt-3 pt-3 border-top">
                                    <span>Att betala</span>
                                    <span>{formatPrice(totals.total)} kr</span>
                                </div>
                            </div>

                            <button
                                className="pay-btn"
                                onClick={handlePayment}
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                    <>
                                        <Lock size={18} />
                                        Betala {formatPrice(totals.total)} kr
                                    </>
                                )}
                            </button>

                            <div className="secure-badge">
                                <ShieldCheck size={16} />
                                <span>Säker krypterad betalning</span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
