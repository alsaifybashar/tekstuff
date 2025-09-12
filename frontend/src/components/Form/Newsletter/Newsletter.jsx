import React, { useState } from 'react';
import './Newsletter.css';

const Newsletter = ({
  title = "Få exklusiva erbjudanden",
  description = "Prenumerera på vårt nyhetsbrev och få 10% rabatt på ditt första köp",
  onSignup,
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // 'success', 'error', ''
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }

    setLoading(true);
    
    try {
      if (onSignup) {
        await onSignup(email);
      }
      setStatus('success');
      setEmail('');
      setTimeout(() => setStatus(''), 5000);
    } catch (error) {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`newsletter-section ${className}`}>
      <div className="newsletter-container">
        <div className="newsletter-content">
          <h2 className="newsletter-title">{title}</h2>
          <p className="newsletter-description">{description}</p>
          
          <form className="newsletter-form" onSubmit={handleSubmit}>
            <div className="newsletter-input-wrapper">
              <input
                type="email"
                className="newsletter-input"
                placeholder="Din e-postadress"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                aria-label="E-postadress för nyhetsbrev"
              />
              <button 
                type="submit" 
                className="newsletter-button"
                disabled={loading}
              >
                {loading ? 'Skickar...' : 'Prenumerera'}
              </button>
            </div>
            
            {status === 'success' && (
              <div className="newsletter-message success">
                ✓ Tack för din prenumeration! Kolla din e-post för bekräftelse.
              </div>
            )}
            
            {status === 'error' && (
              <div className="newsletter-message error">
                ✗ Något gick fel. Kontrollera din e-postadress och försök igen.
              </div>
            )}
          </form>
          
          <p className="newsletter-privacy">
            Vi respekterar din integritet. Läs vår <a href="/legal/privacy">integritetspolicy</a>.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;