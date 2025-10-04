import React from 'react';

const LoadingSpinner = ({ size = 'large' }) => {
  const spinnerSize = size === 'small' ? '20px' : '40px';
  
  return (
    <div className="flex items-center justify-center p-8">
      <div 
        className="loading-spinner" 
        style={{ width: spinnerSize, height: spinnerSize }}
      ></div>
    </div>
  );
};

export default LoadingSpinner;