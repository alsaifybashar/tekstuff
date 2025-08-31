// src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import Button from "react-bootstrap/Button";
import { useCart } from "../context/CartContext";
import "./ProductCard.css";                   // ⟵ add

export default function ProductCard({ product }) {
  const { add } = useCart();
  if (!product) return null;

  const {
    id, slug, title, name, price, oldPrice,
    image, images, brand, inStock = true, isDeal,
  } = product;

  const displayName = name || title || "Produkt";
  const displayImage = image || images?.[0];

  return (
    <div className="card h-100 product-card">            {/* ⟵ class for hover & spacing */}
      {/* image area */}
      <Link to={slug ? `/p/${slug}` : "#"} className="text-decoration-none text-dark">
        <div className="product-thumb position-relative">
          {isDeal && (
            <span className="badge bg-danger product-badge">SUPER DEAL</span>
          )}
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayName}
              className="product-thumb-img"             // ⟵ styled to contain, not crop
              loading="lazy"
              decoding="async"
              sizes="(min-width: 992px) 220px, 40vw"
              style={{ objectFit: "contain", height: 200, width: "100%" }}
            />
          ) : (
            <div className="product-thumb-placeholder">Ingen bild</div>
          )}
        </div>
      </Link>

      {/* body */}
      <div className="card-body d-flex flex-column">
        <Link to={slug ? `/p/${slug}` : "#"} className="stretched-link text-decoration-none text-dark">
          <h3 className="h6 mb-1 product-title">{displayName}</h3>
        </Link>
        {brand && <div className="text-muted small mb-2">{brand}</div>}

        <div className="mt-auto">
          <div className="d-flex align-items-baseline gap-2">
            <span className="fw-semibold">{price} kr</span>
            {oldPrice ? <s className="text-muted small">{oldPrice} kr</s> : null}
          </div>

          <div className="d-flex gap-2 mt-2">
            <Button
              variant="dark"
              size="sm"
              disabled={!inStock}
              onClick={(e) => { e.preventDefault(); id && add(id, 1); }}
            >
              Lägg i kundvagn
            </Button>
            <Button as={Link} to={slug ? `/p/${slug}` : "#"} variant="outline-secondary" size="sm">
              Visa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

ProductCard.propTypes = { product: PropTypes.object };
