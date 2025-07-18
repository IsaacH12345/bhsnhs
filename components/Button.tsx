
import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  iconSrc?: string;
  disabled?: boolean; // Added disabled prop
}

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const Button: React.FC<ButtonProps> = ({ to, onClick, children, className, iconSrc, disabled }) => {
  const baseClasses = "inline-flex items-center justify-center text-center bg-[var(--button-primary-background)] hover:bg-[var(--button-primary-background-hover)] text-[var(--buttonText)] font-semibold rounded-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--button-ring)] focus:ring-opacity-50 py-3 px-6 text-2xl sm:py-4 sm:px-8 sm:text-3xl md:py-7 md:px-11 md:text-4xl";
  
  // Specific classes for disabled state to override hover effects and add opacity/cursor
  const disabledStateClasses = "opacity-50 cursor-not-allowed hover:bg-[var(--button-primary-background)]";
  // Tailwind's native 'disabled:' variant for actual button elements
  const nativeButtonDisabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--button-primary-background)]";

  const content = (
    <div className="flex items-center justify-center text-center">
      {iconSrc && iconSrc !== TRANSPARENT_PIXEL && (
        <img src={iconSrc} alt="" className="h-8 w-8 sm:h-10 md:h-14 mr-3 md:mr-5 object-contain" />
      )}
      <span>{children}</span>
    </div>
  );

  if (to) {
    if (disabled) {
      // Render a span styled as a disabled button if it's a link and disabled
      return (
        <span className={`${baseClasses} ${className} ${disabledStateClasses}`}>
          {content}
        </span>
      );
    }
    // Render as a Link if 'to' prop is provided and not disabled
    return (
      <Link to={to} className={`${baseClasses} ${className}`}>
        {content}
      </Link>
    );
  }

  // Render as a button if 'to' prop is not provided
  return (
    <button 
      onClick={onClick} 
      className={`${baseClasses} ${className} ${nativeButtonDisabledClasses}`} 
      disabled={disabled}
    >
      {content}
    </button>
  );
};

export default Button;
