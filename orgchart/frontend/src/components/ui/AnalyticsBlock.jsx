import React from 'react';
import { TrendingUp, TrendingDown, Users, Calendar, Briefcase, Award } from 'lucide-react';

const AnalyticsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon,
  className = '' 
}) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600'
  };
  
  const changeIcons = {
    positive: <TrendingUp className="w-4 h-4" />,
    negative: <TrendingDown className="w-4 h-4" />,
    neutral: null
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {Icon && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
        )}
      </div>
      {change && (
        <div className={`flex items-center mt-4 ${changeColors[changeType]}`}>
          {changeIcons[changeType]}
          <span className="text-sm font-medium ml-1">{change}</span>
        </div>
      )}
    </div>
  );
};

const AnalyticsBlock = ({ children, className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 ${className}`}>
      {children}
    </div>
  );
};

export default AnalyticsBlock;
export { AnalyticsCard }; 