import React from 'react';

const FourPointedStar = ({ className = "w-3 h-3", color = "text-primary" }) => {
  return (
    <svg 
      width="14" 
      height="14" 
      viewBox="0 0 14 14" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} mr-[6px] min-w-[14px] rounded-[1px]`}
    >
      <polygon points="7,1 8.2,5.2 13,7 8.2,8.8 7,13 5.8,8.8 1,7 5.8,5.2" fill="#E42E0F" />
    </svg>
  );
};

export default FourPointedStar; 