import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  disabled = false,
  type = 'button',
  className = '',
  icon,
  ...props 
}) => {
  const baseClasses = 'flex items-center gap-2 font-medium text-sm transition select-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'px-2 lg:px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90',
    secondary: 'px-2 lg:px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-[8px] hover:bg-gray-50',
    gray: 'px-2 lg:px-4 py-2 bg-gray-100 text-gray-700 rounded-[8px] hover:bg-gray-200',
    danger: 'px-2 lg:px-4 py-2 bg-red-600 text-white rounded-[8px] hover:bg-red-700',
    success: 'px-2 lg:px-4 py-2 bg-green-600 text-white rounded-[8px] hover:bg-green-700',
    warning: 'px-2 lg:px-4 py-2 bg-yellow-600 text-white rounded-[8px] hover:bg-yellow-700'
  };
  
  const sizes = {
    sm: 'px-2 py-1.5 text-xs',
    md: 'px-2 lg:px-4 py-2 text-sm',
    lg: 'px-4 lg:px-6 py-3 text-base',
    xl: 'px-6 lg:px-8 py-4 text-lg'
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;
  
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

export default Button; 