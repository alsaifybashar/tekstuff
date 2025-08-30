// src/components/ProductImageGallery.jsx
import React, { useState, useMemo, useCallback } from 'react';
import './ProductImageGallery.css';

// images can be URLs or imported assets
export default function ProductImageGallery({ images = [], alt = '' }) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [idx, setIdx] = useState(0);

  const onThumbClick = useCallback((i) => setIdx(i), []);

  if (!safeImages.length) return null;

  return (
    <div className="product-gallery">
      <div className="product-gallery-main mb-3">
        <img
          src={safeImages[idx]}
          alt={alt || 'Product image'}
          className="img-fluid rounded border"
          loading="eager"
        />
      </div>

      {safeImages.length > 1 && (
        <div className="product-gallery-thumbs d-flex gap-2 flex-wrap">
          {safeImages.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={`thumb-btn btn p-0 ${i === idx ? 'selected' : ''}`}
              onClick={() => onThumbClick(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <img src={src} alt={`Thumbnail ${i + 1}`} className="thumb-img rounded border" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
