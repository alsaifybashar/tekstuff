import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, MapPin, CreditCard, ChevronRight, Package, Info } from 'lucide-react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer/Footer";
import CheckoutSteps from "../components/CheckoutSteps";
import { useCart } from "../context/CartContext";
import allProducts from "../data/products.js";
import "./DeliveryPage.css";
import "./CartPage.css";

// Mock delivery services
const ALL_DELIVERY_OPTIONS = [
    {
        id: 'postnord-ombud',
        name: 'PostNord Ombud',
        description: 'Leverans till ditt närmaste ombud. 1-2 vardagar.',
        price: 49,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/PostNord_logo.svg/2560px-PostNord_logo.svg.png',
        requiresZipPrefix: null
    },
    {
        id: 'instabox',
        name: 'Instabox',
        description: 'Expressleverans till paketskåp.',
        price: 39,
        logo: 'https://cdn.worldvectorlogo.com/logos/instabox.svg',
        requiresZipPrefix: ['1', '2', '3']
    },
    {
        id: 'budbee',
        name: 'Budbee Hemleverans',
        description: 'Klimatkompenserad hemleverans kvällstid.',
        price: 69,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Budbee_logo.png',
        requiresZipPrefix: ['1', '2']
    },
    {
        id: 'postnord-hem',
        name: 'PostNord Hemleverans',
        description: 'Leverans till dörren dagtid.',
        price: 99,
        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/PostNord_logo.svg/2560px-PostNord_logo.svg.png',
        requiresZipPrefix: null
    }
];

export default function DeliveryPage() {
    const navigate = useNavigate();
    const { items, count } = useCart();

    // Redirect if cart empty
    useEffect(() => {
        if (count === 0) {
            navigate('/cart');
        }
    }, [count, navigate]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        zip: '',
        city: ''
    });

    const [availableOptions, setAvailableOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);

    // Calculate totals
    const totals = useMemo(() => {
        let subtotal = 0;

        // Calculate subtotal from cart items
        Object.entries(items).forEach(([id, qty]) => {
            const product = allProducts.find(p =>
                String(p.id) === String(id) || String(p.slug) === String(id)
            );

            if (product) {
                subtotal += (Number(product.price) || 0) * (Number(qty) || 0);
            }
        });

        const deliveryCost = selectedOption ? selectedOption.price : 0;
        const total = subtotal + deliveryCost;

        return {
            subtotal,
            deliveryCost,
            total
        };
    }, [items, selectedOption]);

    const formatPrice = (p) => new Intl.NumberFormat('sv-SE', { maximumFractionDigits: 0 }).format(p);

    // Update available options when Zip changes
    useEffect(() => {
        let cancelled = false;

        async function fetchOptions() {
            if (formData.zip.length < 3) return;

            try {
                // 1. Static/Internal Options (PostNord, Budbee mock for now)
                const prefix = formData.zip.charAt(0);
                const internalOptions = ALL_DELIVERY_OPTIONS.filter(opt => {
                    if (opt.id.includes('instabox')) return false; // Remove hardcoded Instabox
                    if (!opt.requiresZipPrefix) return true;
                    return opt.requiresZipPrefix.includes(prefix);
                });

                // 2. Fetch Instabox from our Backend
                // Use relative path if proxied, or full URL
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const response = await fetch(`${apiUrl}/api/instabox/availability`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        zip_code: formData.zip.replace(/\s/g, ''), // Clean spaces
                        street: formData.address || '',
                        city: formData.city || ''
                    })
                });

                const data = await response.json();
                let instaboxOptions = [];

                if (data.success && data.options) {
                    instaboxOptions = data.options.map(opt => ({
                        id: opt.id,
                        name: opt.name,
                        description: opt.location ? `${opt.location.name} (${opt.location.distance})` : (opt.eta || 'Expressleverans'),
                        price: opt.price,
                        logo: 'https://cdn.worldvectorlogo.com/logos/instabox.svg',
                        type: 'instabox',
                        raw: opt
                    }));
                }

                if (!cancelled) {
                    const combined = [...internalOptions, ...instaboxOptions];

                    if (combined.length === 0) {
                        // Fallback if nothing found
                        setAvailableOptions([ALL_DELIVERY_OPTIONS.find(o => o.id === 'postnord-ombud')]);
                    } else {
                        setAvailableOptions(combined);
                    }

                    // Select first available if current selection is invalid
                    // Or prioritize Instabox if new options appear
                    if (!selectedOption || !combined.find(o => o.id === selectedOption.id)) {
                        if (combined.length > 0) setSelectedOption(combined[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch delivery options", err);
                // Fallback to basic options
                if (!cancelled) {
                    setAvailableOptions([ALL_DELIVERY_OPTIONS.find(o => o.id === 'postnord-ombud')]);
                }
            }
        }

        const timer = setTimeout(fetchOptions, 500); // Debounce
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [formData.zip, formData.address, formData.city]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProceed = () => {
        // Validate
        if (!formData.firstName || !formData.address || !formData.zip || !selectedOption) {
            alert("Vänligen fyll i alla uppgifter.");
            return;
        }
        // Save state (in context or local storage) and go to payment
        // For now, just navigate
        navigate('/payment');
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            <Navbar />
            <main className="flex-grow-1 delivery-container">
                <CheckoutSteps currentStep={2} />

                <div className="delivery-content">
                    {/* Left Column: Form & Options */}
                    <div className="left-column">

                        {/* 1. Personuppgifter */}
                        <section className="delivery-section">
                            <h2 className="section-title">
                                <div className="icon-circle bg-primary-subtle text-primary p-2 rounded-circle">
                                    <MapPin size={20} />
                                </div>
                                Dina uppgifter
                            </h2>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Förnamn</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        className="form-control"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        placeholder="T.ex. Anna"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Efternamn</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        className="form-control"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        placeholder="Andersson"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Gatuadress</label>
                                    <input
                                        type="text"
                                        name="address"
                                        className="form-control"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        placeholder="Storgatan 1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Postnummer</label>
                                    <input
                                        type="text"
                                        name="zip"
                                        className="form-control"
                                        value={formData.zip}
                                        onChange={handleInputChange}
                                        placeholder="123 45"
                                        maxLength={6}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Ort</label>
                                    <input
                                        type="text"
                                        name="city"
                                        className="form-control"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="Stockholm"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>E-post</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="namn@exempel.se"
                                    />
                                </div>
                                <div className="form-group full-width">
                                    <label>Mobilnummer</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="form-control"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="070 123 45 67"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 2. Leveransalternativ */}
                        <section className="delivery-section">
                            <h2 className="section-title">
                                <div className="icon-circle bg-primary-subtle text-primary p-2 rounded-circle">
                                    <Truck size={20} />
                                </div>
                                Leveransalternativ
                            </h2>

                            {!formData.zip ? (
                                <div className="alert alert-info d-flex align-items-center gap-2">
                                    <Info size={18} />
                                    <span>Ange ditt postnummer ovan för att se leveransalternativ.</span>
                                </div>
                            ) : (
                                <div className="delivery-options-grid">
                                    {availableOptions.map(option => (
                                        <div
                                            key={option.id}
                                            className={`delivery-option-card ${selectedOption?.id === option.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedOption(option)}
                                        >
                                            <div className="delivery-info">
                                                <div style={{ width: 50, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <img src={option.logo} alt={option.name} className="delivery-logo" onError={(e) => e.target.style.display = 'none'} />
                                                    <span style={{ display: option.logo ? '' : 'block', fontSize: '0.8rem', fontWeight: 'bold' }}>{!option.logo && 'Lev'}</span>
                                                </div>
                                                <div className="delivery-details">
                                                    <span className="delivery-name">{option.name}</span>
                                                    <span className="delivery-desc">{option.description}</span>
                                                </div>
                                            </div>
                                            <div className={`delivery-price ${option.price === 0 ? 'free' : ''}`}>
                                                {option.price === 0 ? 'GRATIS' : `${option.price} kr`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                    </div>

                    {/* Right Column: Summary */}
                    <div className="right-column summary-panel">
                        <div className="price-section">
                            <h2 className="price-title">Översikt</h2>

                            <div className="price-breakdown">
                                <div className="price-row">
                                    <span>Antal varor</span>
                                    <span>{count} st</span>
                                </div>
                                <div className="price-row">
                                    <span>Delsumma</span>
                                    <span>{formatPrice(totals.subtotal)} kr</span>
                                </div>
                                <div className="price-row">
                                    <span>Frakt</span>
                                    <span>{selectedOption ? (selectedOption.price === 0 ? 'Fri frakt' : `${selectedOption.price} kr`) : '-'}</span>
                                </div>
                                <div className="price-row total mt-3 pt-3 border-top">
                                    <span>Att betala</span>
                                    <span>{formatPrice(totals.total)} kr</span>
                                </div>
                            </div>

                            <button className="checkout-btn mt-4" onClick={handleProceed}>
                                Gå till betalning
                            </button>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    );
}
