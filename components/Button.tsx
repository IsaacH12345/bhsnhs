
import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ to, onClick, children, className }) => {
  const baseClasses = "w-full text-center py-3 px-6 bg-[#3B375E] hover:bg-[#4C4674] text-white text-lg font-semibold rounded-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#6F6AA0] focus:ring-opacity-50";
  
  if (to) {
    return (
      <Link to={to} className={`${baseClasses} ${className}`}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`${baseClasses} ${className}`}>
      {children}
    </button>
  );
};

export default Button;
    