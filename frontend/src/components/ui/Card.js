import React from 'react';

export default function Card({ className = '', children, padded = true, shadow = true, border = true }) {
  const base = 'bg-white rounded-2xl';
  const padding = padded ? 'p-6' : '';
  const withShadow = shadow ? 'shadow-sm' : '';
  const withBorder = border ? 'border border-gray-200' : '';
  return <div className={`${base} ${withShadow} ${withBorder} ${padding} ${className}`}>{children}</div>;
}

