// src/pages/ProductPage.jsx
import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProductBySlug, getRelatedProducts } from "../services/catalog";
import ProductImageGallery from "../components/ProductImageGallery";
import QuantityPicker from "../components/QuantityPicker";
import SpecsTable from "../components/SpecsTable";
import { useCart } from "../context/CartContext";
import ProductGrid from "../components/ProductGrid";
import Navbar from "../components/Navbar";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";

import RatingStars from "../components/RatingStars";
import TrustBadges from "../components/TrustBadges";
import PriceBlock from "../components/PriceBlock";
import BundleBox from "../components/BundleBox";
import StickyBuyBar from "../components/StickyBuyBar";

// ✅ correct file path
import ProductCarousel from "../components/ProductCarousel/ProductCarousel";
import productNum from "../data/products";
import Footer from "../components/Footer/Footer";

const packageProducts = [
  { id: "tape", title: "SiGN LCD Tejp", image: "src/assets/charger/laddare1.webp", price: "49 kr" },
  { id: "tool", title: "Verktygskit iPhone – 7 delar", image: "src/assets/charger/laddare2.webp", price: "59 kr" },
];






export default function ProductPage() {
  const { slug } = useParams();
  const product = useMemo(() => getProductBySlug(slug), [slug]);
  const related = useMemo(() => getRelatedProducts(product, 8), [product]);
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="container py-5">
        <h1 className="h3">Produkten hittades inte</h1>
        <p className="text-muted">
          We couldn’t find a product with slug: <code>{slug}</code>.
        </p>
        <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
      </div>
    );
  }

  const {
    title, name, price, oldPrice, images = [],
    description, longDescription, specs, brand,
    rating, reviewsCount, inStock = true, category, categories, sku,
  } = product;

  const categorySlug = category ?? (Array.isArray(categories) ? categories[0] : undefined);
  const displayName = name || title;

  return (
    <>
      <Navbar />

      <div className="container py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            {categorySlug && (
              <li className="breadcrumb-item"><Link to={`/c/${categorySlug}`}>{categorySlug}</Link></li>
            )}
            <li className="breadcrumb-item active" aria-current="page">{displayName}</li>
          </ol>
        </nav>

        <div className="row g-4">
          {/* Left: Gallery with vertical thumbs (your component already supports it) */}
          <div className="col-12 col-lg-6 d-flex justify-content-center text-center">
            <ProductImageGallery images={images} alt={displayName} />
          </div>

          {/* Right: Buy box */}
          <div className="col-12 col-lg-6">
            <h1 className="h3 mb-2">{displayName}</h1>
            <RatingStars value={rating ?? 0} count={reviewsCount} />

            <div className="mt-2">{sku && <small className="text-muted">SKU: {sku}</small>}</div>

            {/* Price + discount */}
            <PriceBlock price={price} oldPrice={oldPrice} />

            {/* Availability pill */}
            <div className={`badge ${inStock ? "bg-success" : "bg-secondary"} mb-3`}>
              {inStock ? "Lagervara för omgående leverans" : "Slut i lager"}
            </div>

            {/* Qty + Add */}
            <div className="d-flex align-items-center gap-3 my-3">
              <QuantityPicker value={qty} onChange={setQty} min={1} max={99} />
              <button
                type="button"
                className="btn btn-dark btn-lg"
                disabled={!inStock}
                onClick={() => add(product.id, qty)}
              >
                Lägg i varukorg
              </button>
            </div>

            {/* Trust badges */}
            <TrustBadges />

            {/* Bundle box (upsells) */}
            <BundleBox products={packageProducts} onAdd={() => packageProducts.forEach(u => addItem(u, 1))} />


            {/* Tabs: info/specs */}
            <Tabs defaultActiveKey="desc" className="mt-3">
              <Tab eventKey="desc" title="Produktinformation">
                <div className="border border-top-0 p-3 rounded-bottom">
                  <p className="mb-0">{longDescription || description}</p>
                </div>
              </Tab>
              <Tab eventKey="specs" title="Specifikationer">
                <div className="border border-top-0 p-3 rounded-bottom">
                  <SpecsTable specs={specs} />
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>

        {/* Related slider */}
        {related?.length > 0 && (
          <section className="mt-5">
            <h2 className="h5 mb-3">Relaterade produkter</h2>
            <ProductGrid products={related} />
          </section>
        )}
      </div>

      {/* Sticky buy bar on mobile */}
      <StickyBuyBar
        name={displayName}
        price={price}
        canBuy={inStock}
        onAdd={() => add(product.id, 1)}
      />

      <br />

      {/* “Liknande produkter” carousel block (demo data) */}
      <ProductCarousel title="Liknande produkter" products={related?.length ? related : productNum} />


      <br></br>
      <br></br>

      <Footer />

    </>
  );
}
