import React from 'react';

export default function PlaceholderImage({ 
  width = 200, 
  height = 200, 
  text = 'Product Image',
  className = '',
  alt = 'Product image'
}) {
  return (
    <div 
      className={`d-flex align-items-center justify-content-center bg-light border ${className}`}
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`
      }}
    >
      <div className="text-center text-muted">
        <i className="bi bi-image" style={{ fontSize: '2rem' }}></i>
        <br />
        <small>{text}</small>
      </div>
    </div>
  );
}
