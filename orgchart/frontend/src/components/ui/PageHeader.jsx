import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle,
  children,
  className = '' 
}) => {
  return (
    <div className={`relative z-20 flex items-center justify-between mb-6 gap-2 sm:gap-4 md:gap-8 flex-wrap ${className}`}>
      <div>
        <h1 className="text-[32px] font-bold font-accent text-primary">{title}</h1>
        {subtitle && (
          <p className="text-gray-600 mt-2">{subtitle}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader; 