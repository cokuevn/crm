import React from 'react';

const variantClasses = {
  primary:
    'bg-gradient-to-b from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md focus:ring-blue-500',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
  success:
    'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  outline:
    'bg-white text-blue-600 border border-gray-200 hover:bg-blue-50 focus:ring-blue-500',
  ghost:
    'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300',
};

const sizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-sm',
  lg: 'h-10 px-5 text-base',
};

const iconSizeClasses = {
  sm: '[&>svg]:w-4 [&>svg]:h-4',
  md: '[&>svg]:w-4 [&>svg]:h-4',
  lg: '[&>svg]:w-5 [&>svg]:h-5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  iconSize = 'md',
  className = '',
  leadingIcon = null,
  fullWidth = false,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold leading-none transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const width = fullWidth ? 'w-full' : '';
  return (
    <button
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${width} ${className}`}
      {...rest}
    >
      {leadingIcon ? <span className={`inline-flex items-center justify-center shrink-0 ${iconSizeClasses[iconSize]}`}>{leadingIcon}</span> : null}
      {children}
    </button>
  );
}

