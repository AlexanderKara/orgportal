import React from 'react';

const Checkbox = ({ 
  checked, 
  onChange, 
  disabled = false, 
  id, 
  label, 
  className = '', 
  ...props 
}) => {
  return (
    <label className={`flex items-center cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          id={id}
          className="sr-only peer"
          {...props}
        />
        <div className={`w-4 h-4 border-2 rounded transition-colors ${
          disabled 
            ? 'bg-gray-100 border-gray-300' 
            : checked 
              ? 'bg-primary border-primary' 
              : 'bg-white border-gray-300 hover:border-primary'
        }`}>
          {checked && (
            <svg 
              className="w-3 h-3 text-white absolute top-0.5 left-0.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
        </div>
      </div>
      {label && (
        <span className={`ml-2 text-sm font-medium ${
          disabled ? 'text-gray-400' : 'text-gray-700'
        }`}>
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox; 