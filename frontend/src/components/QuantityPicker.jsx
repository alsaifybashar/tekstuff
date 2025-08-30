// src/components/QuantityPicker.jsx
import React from 'react';

export default function QuantityPicker({ value, onChange, min = 1, max = 99 }) {
  const dec = () => onChange(Math.max(min, (value || min) - 1));
  const inc = () => onChange(Math.min(max, (value || min) + 1));

  return (
    <div className="d-inline-flex align-items-center border rounded">
      <button type="button" className="btn btn-light" onClick={dec} aria-label="Decrease quantity">−</button>
      <input
        className="form-control text-center"
        style={{ width: 64, borderLeft: 0, borderRight: 0 }}
        type="number"
        value={value ?? min}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Quantity"
      />
      <button type="button" className="btn btn-light" onClick={inc} aria-label="Increase quantity">+</button>
    </div>
  );
}
