import React from 'react';
import './Badge.css';

const Badge = ({
  children,
  variant = 'primary', // primary, secondary, success, danger, warning, info
  size = 'medium',      // small, medium, large
  pill = false,
  className = ''
}) => {
  const badgeClass = [
    'badge',
    `badge-${variant}`,
    `badge-${size}`,
    pill && 'badge-pill',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClass}>
      {children}
    </span>
  );
};

export default Badge;