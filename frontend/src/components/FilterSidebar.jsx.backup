import React, { useState } from "react";
import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Badge from "react-bootstrap/Badge";
import { X, Filter, RotateCcw } from "lucide-react";
import "./FilterSidebar.css";

export default function FilterSidebar({ facets, value, onChange, onClear }) {
  const { price, brands = [], attrs = {}, rating, inStock, deals } = value;
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Count active filters
  const activeFiltersCount = [
    price && (price[0] !== facets.price.min || price[1] !== facets.price.max),
    brands.length > 0,
    Object.values(attrs).some(arr => arr?.length > 0),
    rating,
    inStock,
    deals
  ].filter(Boolean).length;

  return (
    <div className="enhanced-filter-sidebar">
      {/* Header */}
      <div className="filter-header">
        <div className="filter-title-section">
          <Filter size={20} className="filter-icon" />
          <h3 className="filter-title">Filter</h3>
          {activeFiltersCount > 0 && (
            <Badge bg="primary" className="filter-count-badge">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        
        {activeFiltersCount > 0 && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onClear}
            className="clear-all-btn"
          >
            <RotateCcw size={14} />
            Rensa alla
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {activeFiltersCount > 0 && (
        <div className="active-filters-summary">
          <div className="active-filters-title">Aktiva filter:</div>
          <div className="active-filters-tags">
            {brands.map(brand => (
              <span key={brand} className="filter-tag">
                {brand}
                <button
                  className="filter-tag-remove"
                  onClick={() => onChange({ brands: brands.filter(b => b !== brand) })}
                  aria-label={`Ta bort ${brand} filter`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {Object.entries(attrs).map(([key, values]) =>
              values?.map(value => (
                <span key={`${key}-${value}`} className="filter-tag">
                  {value}
                  <button
                    className="filter-tag-remove"
                    onClick={() => {
                      const newAttrs = { ...attrs };
                      newAttrs[key] = newAttrs[key].filter(v => v !== value);
                      if (newAttrs[key].length === 0) delete newAttrs[key];
                      onChange({ attrs: newAttrs });
                    }}
                    aria-label={`Ta bort ${value} filter`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
            {rating && (
              <span className="filter-tag">
                {rating}+ stjärnor
                <button
                  className="filter-tag-remove"
                  onClick={() => onChange({ rating: undefined })}
                  aria-label="Ta bort betyg filter"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="filter-sections">
        <Accordion defaultActiveKey={["price", "brand", "type"]} alwaysOpen>
          {/* Price Filter */}
          <Accordion.Item eventKey="price" className="filter-section">
            <Accordion.Header className="filter-section-header">
              <span className="filter-section-title">Pris</span>
              {price && (price[0] !== facets.price.min || price[1] !== facets.price.max) && (
                <Badge bg="primary" size="sm" className="active-indicator">●</Badge>
              )}
            </Accordion.Header>
            <Accordion.Body className="filter-section-body">
              <PriceRange
                min={facets.price.min}
                max={facets.price.max}
                value={price || [facets.price.min, facets.price.max]}
                onChange={(v) => onChange({ price: v })}
              />
            </Accordion.Body>
          </Accordion.Item>

          {/* Brand Filter */}
          <Accordion.Item eventKey="brand" className="filter-section">
            <Accordion.Header className="filter-section-header">
              <span className="filter-section-title">Märke</span>
              {brands.length > 0 && (
                <Badge bg="primary" size="sm" className="active-indicator">
                  {brands.length}
                </Badge>
              )}
            </Accordion.Header>
            <Accordion.Body className="filter-section-body">
              <div className="checkbox-group">
                {facets.brands.map(b => (
                  <label key={b.value} className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={brands.includes(b.value)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...brands, b.value]
                          : brands.filter(x => x !== b.value);
                        onChange({ brands: next });
                      }}
                    />
                    <span className="checkbox-checkmark"></span>
                    <span className="checkbox-label">
                      {b.value}
                      <span className="item-count">({b.count})</span>
                    </span>
                  </label>
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          {/* Attribute Filters */}
          {Object.entries(facets.attrs).map(([k, values]) => (
            <Accordion.Item eventKey={k} key={k} className="filter-section">
              <Accordion.Header className="filter-section-header">
                <span className="filter-section-title">{labelFor(k)}</span>
                {attrs[k]?.length > 0 && (
                  <Badge bg="primary" size="sm" className="active-indicator">
                    {attrs[k].length}
                  </Badge>
                )}
              </Accordion.Header>
              <Accordion.Body className="filter-section-body">
                <div className="checkbox-group">
                  {values.map(v => (
                    <label key={v.value} className="custom-checkbox">
                      <input
                        type="checkbox"
                        checked={!!(attrs[k]?.includes(v.value))}
                        onChange={(e) => {
                          const set = new Set(attrs[k] || []);
                          e.target.checked ? set.add(v.value) : set.delete(v.value);
                          onChange({ attrs: { ...attrs, [k]: [...set] } });
                        }}
                      />
                      <span className="checkbox-checkmark"></span>
                      <span className="checkbox-label">
                        {v.value}
                        <span className="item-count">({v.count})</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}

          {/* Rating & Other Filters */}
          <Accordion.Item eventKey="more" className="filter-section">
            <Accordion.Header className="filter-section-header">
              <span className="filter-section-title">Övriga filter</span>
              {(rating || inStock || deals) && (
                <Badge bg="primary" size="sm" className="active-indicator">●</Badge>
              )}
            </Accordion.Header>
            <Accordion.Body className="filter-section-body">
              {/* Rating Filter */}
              <div className="filter-subsection">
                <div className="subsection-title">Betyg</div>
                <div className="radio-group">
                  {[4, 3, 2, 1].map(stars => (
                    <label key={stars} className="custom-radio">
                      <input
                        name="rating"
                        type="radio"
                        checked={rating === stars}
                        onChange={() => onChange({ rating: stars })}
                      />
                      <span className="radio-checkmark"></span>
                      <span className="radio-label">
                        {"★".repeat(stars)}{"☆".repeat(5-stars)} och uppåt
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Boolean Filters */}
              <div className="filter-subsection">
                <div className="subsection-title">Tillgänglighet</div>
                <div className="switch-group">
                  <label className="custom-switch">
                    <input
                      type="checkbox"
                      checked={!!inStock}
                      onChange={(e) => onChange({ inStock: e.target.checked || undefined })}
                    />
                    <span className="switch-slider"></span>
                    <span className="switch-label">Endast i lager</span>
                  </label>
                  
                  <label className="custom-switch">
                    <input
                      type="checkbox"
                      checked={!!deals}
                      onChange={(e) => onChange({ deals: e.target.checked || undefined })}
                    />
                    <span className="switch-slider"></span>
                    <span className="switch-label">Endast kampanj</span>
                  </label>
                </div>
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  );
}

// Enhanced Price Range Component
function PriceRange({ min, max, value, onChange }) {
  const [lo, hi] = value;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  
  return (
    <div className="price-range-container">
      <div className="price-inputs">
        <div className="price-input-group">
          <label className="price-label">Från</label>
          <input
            type="number"
            className="price-input"
            min={min}
            max={hi}
            value={lo}
            onChange={(e) => onChange([clamp(+e.target.value, min, hi), hi])}
            placeholder="Min"
          />
          <span className="price-currency">kr</span>
        </div>
        
        <div className="price-separator">–</div>
        
        <div className="price-input-group">
          <label className="price-label">Till</label>
          <input
            type="number"
            className="price-input"
            min={lo}
            max={max}
            value={hi}
            onChange={(e) => onChange([lo, clamp(+e.target.value, lo, max)])}
            placeholder="Max"
          />
          <span className="price-currency">kr</span>
        </div>
      </div>
      
      <div className="price-range-display">
        <span className="range-text">
          {new Intl.NumberFormat('sv-SE').format(lo)} kr - {new Intl.NumberFormat('sv-SE').format(hi)} kr
        </span>
      </div>
    </div>
  );
}

const labelFor = (k) => ({
  type: "Produkttyp",
  connector: "Kontakt",
  cableLength: "Kabellängd"
}[k] || k);