
import React from 'react';

interface InfoBoxProps {
  children: React.ReactNode;
  className?: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({ children, className }) => {
  // Default styling less specific, allowing className to override easily
  // Removed h-full from baseClasses
  const baseClasses = "p-4 rounded-xl shadow-lg flex flex-col";
  return (
    <div className={`${baseClasses} ${className}`}>
      <div className="flex-grow overflow-y-auto pr-2"> 
        {children}
      </div>
    </div>
  );
};

export default InfoBox;