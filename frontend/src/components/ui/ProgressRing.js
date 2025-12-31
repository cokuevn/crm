import React, { memo } from 'react';

const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = 'emerald' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorMap = {
    emerald: '#10b981',
    blue: '#3b82f6',
    purple: '#8b5cf6',
    orange: '#f59e0b',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg height={size} width={size} className="transform -rotate-90">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={colorMap[color] || colorMap.emerald}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          className="transition-all duration-1000 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{progress.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export default memo(ProgressRing, (prevProps, nextProps) => {
  // Ререндер только если изменились progress или color
  return prevProps.progress === nextProps.progress && 
         prevProps.color === nextProps.color &&
         prevProps.size === nextProps.size;
});

