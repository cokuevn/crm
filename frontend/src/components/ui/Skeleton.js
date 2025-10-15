import React from 'react';

export const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200/80 dark:bg-gray-700/30 rounded ${className}`} />
);

export const SkeletonCircle = ({ size = 40, className = '' }) => (
  <div
    className={`animate-pulse bg-gray-200/80 dark:bg-gray-700/30 rounded-full ${className}`}
    style={{ width: size, height: size }}
  />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={className}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="animate-pulse bg-gray-200/80 dark:bg-gray-700/30 h-3 rounded mb-2 last:mb-0" />
    ))}
  </div>
);

export default Skeleton;

