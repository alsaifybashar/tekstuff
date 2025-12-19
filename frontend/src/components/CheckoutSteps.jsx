import React from 'react';
import './CheckoutSteps.css';

export default function CheckoutSteps({ currentStep }) {
  // currentStep: 1 (Cart), 2 (Delivery), 3 (Payment)
  
  return (
    <div className="progress-steps">
      <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
        <div className="step-number">01</div>
        <span className="step-label">Min kundvagn</span>
      </div>
      <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
      <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
        <div className="step-number">02</div>
        <span className="step-label">Leveransinfo</span>
      </div>
      <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
      <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
        <div className="step-number">03</div>
        <span className="step-label">Betalning</span>
      </div>
    </div>
  );
}
