import React from 'react';

const ViewSwitcher = ({ 
  views, 
  activeView, 
  onViewChange, 
  className = '',
  size = 'md',
  useAdminBreakpoint = false
}) => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  
  const baseClasses = 'flex gap-1 bg-gray rounded-[12px] p-1 flex-wrap';
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {views.map((view) => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-[8px] font-medium text-sm transition select-none flex-1 min-w-0 whitespace-nowrap
            ${activeView === view.id ? 'bg-white text-primary shadow' : 'text-dark hover:bg-secondary hover:text-white'}`}
        >
          {view.icon}
          <span className={`ml-1 sm:ml-[5px] ${useAdminBreakpoint ? 'hidden xl2:inline' : 'hidden sm:inline'}`}>{view.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher; 