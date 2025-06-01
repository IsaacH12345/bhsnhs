
import React from 'react';

interface InfoBoxProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-[#2A2640] p-6 rounded-xl shadow-lg h-full flex flex-col ${className}`}>
      <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
      <div className="flex-grow overflow-y-auto pr-2"> 
        {children}
      </div>
    </div>
  );
};

export default InfoBox;
    