import React from 'react';
import './Section.css';

const Section = ({ 
  children, 
  className = '',
  background = 'white',
  padding = 'normal'
}) => {
  const sectionClass = [
    'custom-section',
    `custom-section-${background}`,
    `custom-section-${padding}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <section className={sectionClass}>
      <div className="custom-section-container">
        {children}
      </div>
    </section>
  );
};

export default Section;