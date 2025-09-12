import React from 'react';
import Button from '../../UI/Button/Button';
import './Hero.css';

const Hero = ({
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  image,
  className = ''
}) => {
  return (
    <section className={`hero ${className}`}>
      <div className="hero-content">
        <div className="hero-text">
          {subtitle && <div className="hero-subtitle">{subtitle}</div>}
          <h1 className="hero-title">{title}</h1>
          {description && <p className="hero-description">{description}</p>}
          
          {(primaryCTA || secondaryCTA) && (
            <div className="hero-actions">
              {primaryCTA && (
                <Button
                  variant="primary"
                  size="large"
                  onClick={primaryCTA.onClick}
                  icon={primaryCTA.icon}
                >
                  {primaryCTA.text}
                </Button>
              )}
              {secondaryCTA && (
                <Button
                  variant="secondary"
                  size="large"
                  onClick={secondaryCTA.onClick}
                  icon={secondaryCTA.icon}
                >
                  {secondaryCTA.text}
                </Button>
              )}
            </div>
          )}
        </div>
        
        {image && (
          <div className="hero-image">
            <img src={image.src} alt={image.alt} />
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;