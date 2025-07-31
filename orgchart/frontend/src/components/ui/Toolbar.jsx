import React from 'react';

const Toolbar = ({ 
  children,
  className = '',
  showBorder = true,
  showBackground = true 
}) => {
  return (
    <div className={`${showBackground ? 'bg-white' : ''} ${showBorder ? 'rounded-lg shadow-sm border border-gray-200' : ''} p-6 mb-8 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {children}
      </div>
    </div>
  );
};

export default Toolbar; 