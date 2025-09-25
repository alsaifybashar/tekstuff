import React from 'react';
import { Card } from 'react-bootstrap';

export default function FilterSidebar({ filters, onUpdate, onClear, activeCount }) {
  // Simple fallback component to prevent crashes
  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <h5 className="mb-0">Filter</h5>
          {activeCount > 0 && (
            <small className="text-muted">({activeCount} aktiva filter)</small>
          )}
        </Card.Header>
        <Card.Body>
          <p className="text-muted">Filtering will be implemented soon...</p>
          
          {activeCount > 0 && (
            <button 
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={onClear}
            >
              Rensa alla filter
            </button>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
