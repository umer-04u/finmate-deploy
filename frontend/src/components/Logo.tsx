import React from 'react';

export const FinmateLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <img 
    src="/logo.svg" 
    alt="Finmate Logo"
    className={className}
    style={{ objectFit: 'contain' }}
  />
);
