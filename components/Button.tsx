import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';

interface ButtonProps {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  iconSrc?: string;
  disabled?: boolean; // Added disabled prop
}

const Button: React.FC<ButtonProps> = ({ to, onClick, children, className, iconSrc, disabled }) => {
  const baseClasses = "inline-flex items-center justify-center text-center bg-[var(--button-primary-background)] hover:bg-[var(--button-primary-background-hover)] text-[var(--buttonText)] font-semibold rounded-2xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--button-ring)] focus:ring-opacity-50 py-4 px-6 text-3xl sm:py-5 sm:px-8 sm:text-4xl md:py-6 md:px-11 md:text-4xl";
  
  // Specific classes for disabled state to override hover effects and add opacity/cursor
  const disabledStateClasses = "opacity-50 cursor-not-allowed hover:bg-[var(--button-primary-background)]";
  // Tailwind's native 'disabled:' variant for actual button elements
  const nativeButtonDisabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[var(--button-primary-background)]";

  const content = (
    <div className="flex items-center justify-center text-center">
      {iconSrc && (
        <img src={iconSrc} alt="" className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 mr-5 sm:mr-6 md:mr-8 object-contain" />
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
      <ReactRouterDOM.Link to={to} className={`${baseClasses} ${className}`}>
        {content}
      </ReactRouterDOM.Link>
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