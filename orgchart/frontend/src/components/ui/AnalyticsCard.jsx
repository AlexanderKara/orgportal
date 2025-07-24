import React from 'react';

const AnalyticsCard = ({ 
  icon, 
  title, 
  value, 
  className = '',
  iconColor = 'text-primary'
}) => {
  return (
    <div className={`bg-white rounded-[15px] border border-gray/50 p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-5 h-5 ${iconColor}`}>
          {icon}
        </span>
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <div className="text-2xl font-bold text-dark">{value}</div>
    </div>
  );
};

export default AnalyticsCard; 