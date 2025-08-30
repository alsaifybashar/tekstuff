// src/pages/ProductPage.jsx
import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductBySlug, getRelatedProducts } from '../services/catalog';
import ProductImageGallery from '../components/ProductImageGallery';
import QuantityPicker from '../components/QuantityPicker';
import SpecsTable from '../components/SpecsTable';
import { useCart } from '../context/CartContext';
// If you prefer your existing grid/carousel:
import ProductGrid from '../components/ProductGrid'; // or ProductCarousel
import Navbar from '../components/Navbar';

import ProductCarousel from '../components/ProductCarousel/ProductCarousel';
import { title } from 'framer-motion/client';


const chargers_relatedproducts = [
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



export default function ProductPage() {
  const { productSlug } = useParams();
  const product = useMemo(() => getProductBySlug(productSlug), [productSlug]);
  const related = useMemo(() => getRelatedProducts(product, 8), [product]);
  const { addItem } = useCart();

  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="container py-5">
        <h1 className="h3">Produkten hittades inte</h1>
        <p className="text-muted">We couldn’t find a product with slug: <code>{productSlug}</code>.</p>
        <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
      </div>
    );
  }

  const {
    title,
    name,
    price,
    oldPrice,
    images = [],
    description,
    longDescription,
    specs,
    brand,
    rating,
    inStock = true,
    category,
    categories,
    sku,
  } = product;

  const stockBadge = inStock
    ? <span className="badge bg-success">Finns i lager</span>
    : <span className="badge bg-secondary">Slut i lager</span>;

  const categorySlug = category ?? (Array.isArray(categories) ? categories[0] : undefined);

  return (
    <>
      <Navbar />

      <br></br>
      <br></br>

      <div className="container py-4">
        {/* Breadcrumbs */}
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/">Home</Link></li>
            {categorySlug && (
              <li className="breadcrumb-item">
                <Link to={`/c/${categorySlug}`}>{categorySlug}</Link>
              </li>
            )}
            <li className="breadcrumb-item active" aria-current="page">{name}</li>
          </ol>
        </nav>

        <div className="row g-4">
          {/* Gallery */}
          <div className="col-12 col-lg-6 d-flex justify-content-center text-center">
            <ProductImageGallery images={images} alt={name} />
          </div>




          {/* Summary / Buy box */}
          <div className="col-12 col-lg-6">
            <h1 className="h3 mb-2">{name}</h1>
            <div className="d-flex align-items-center gap-2 mb-2">
              <h3><strong>{title}</strong></h3>
            </div>

            <div>
              {sku && <span className="text-muted"> SKU. {sku}</span>}
            </div>

            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="h4 mb-0">SEK{Number(price).toFixed(2)}</div>
              {oldPrice && <div className="text-muted text-decoration-line-through">SEK{Number(oldPrice).toFixed(2)}</div>}
              {stockBadge}
            </div>

            {typeof rating === 'number' && (
              <div className="mb-3" aria-label={`Rating ${rating} of 5`}>
                {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
              </div>
            )}

            <p className="text-body">{description}</p>

            <div className="d-flex align-items-center gap-3 my-3">
              <QuantityPicker value={qty} onChange={setQty} min={1} max={99} />
              <button
                type="button"
                className="btn btn-primary btn-lg"
                disabled={!inStock}
                onClick={() => addItem(product, qty)}
              >
                Lägg i varukorg
              </button>
            </div>

            {/* Tabs: Description / Specs */}
            <ul className="nav nav-tabs mt-4" role="tablist">
              <li className="nav-item" role="presentation">
                <button className="nav-link active" id="desc-tab" data-bs-toggle="tab" data-bs-target="#desc-pane" type="button" role="tab" aria-controls="desc-pane" aria-selected="true">Description</button>
              </li>
              <li className="nav-item" role="presentation">
                <button className="nav-link" id="specs-tab" data-bs-toggle="tab" data-bs-target="#specs-pane" type="button" role="tab" aria-controls="specs-pane" aria-selected="false">Specifications</button>
              </li>
            </ul>
            <div className="tab-content border border-top-0 p-3 rounded-bottom">
              <div className="tab-pane fade show active" id="desc-pane" role="tabpanel" aria-labelledby="desc-tab">
                <p className="mb-0">{longDescription || description}</p>
              </div>
              <div className="tab-pane fade" id="specs-pane" role="tabpanel" aria-labelledby="specs-tab">
                <SpecsTable specs={specs} />
              </div>
            </div>
          </div>
        </div>

        {/* Related products */}
        {related?.length > 0 && (
          <section className="mt-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Related products</h2>
              {categorySlug && <Link to={`/c/${categorySlug}`} className="btn btn-link">See all</Link>}
            </div>
            {/* Use your existing grid or carousel component */}
            <ProductGrid products={related} />
            {/* If you prefer your own carousel:
             <ProductCarousel products={related} />
          */}
          </section>
        )}

        {/* SEO: product structured data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name,
            image: images,
            brand: brand ? { '@type': 'Brand', name: brand } : undefined,
            sku,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'SEK',
              price: String(price),
              availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
            },
            aggregateRating: typeof rating === 'number' ? {
              '@type': 'AggregateRating',
              ratingValue: rating,
              reviewCount: Math.max(1, Math.round(rating * 10))
            } : undefined
          })
        }} />
      </div>

      <br></br>

      <ProductCarousel title="Liknande produkter" products={chargers_relatedproducts} />

    </>
  );
}
