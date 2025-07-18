
import React, { useEffect } from 'react';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventName: string;
  description: string;
}

const MODAL_ANIMATION_STYLE_ID = 'event-modal-animation-styles';

const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, eventName, description }) => {
  useEffect(() => {
    // Dynamically inject animation styles
    // This ensures the styles are available when the modal is rendered
    // and cleaned up when it's unmounted.
    if (isOpen) {
      if (!document.getElementById(MODAL_ANIMATION_STYLE_ID)) {
        const styleElement = document.createElement('style');
        styleElement.id = MODAL_ANIMATION_STYLE_ID;
        styleElement.textContent = `
          @keyframes modalFadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-modalFadeInScale {
            animation: modalFadeInScale 0.3s ease-out forwards;
          }
        `;
        document.head.appendChild(styleElement);
      }
    }

    // Cleanup function
    return () => {
      // Only attempt to remove if the modal was open (and thus styles potentially added)
      // This also covers the unmount case if isOpen was true before unmount.
      if (isOpen) { // Check isOpen here to align with conditional addition
        const existingStyleElement = document.getElementById(MODAL_ANIMATION_STYLE_ID);
        if (existingStyleElement) {
          // A more robust cleanup might involve a counter if multiple modals could use this,
          // but for a single modal type that mounts/unmounts, this is generally okay.
           existingStyleElement.remove();
        }
      }
    };
  }, [isOpen]); // Depend on isOpen to manage style addition/removal more tightly with visibility

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on overlay click
      role="dialog"
      aria-modal="true"
      aria-labelledby="eventModalTitle"
    >
      <div 
        className="bg-[var(--infoBoxBackground)] p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="eventModalTitle" className="text-xl sm:text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{eventName}</h3>
          <button 
            onClick={onClose} 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto pr-2 mb-6">
            <p className="text-base sm:text-lg text-[var(--text-secondary)] whitespace-pre-wrap">{description}</p>
        </div>
        <div className="text-right">
            <button
                onClick={onClose}
                className="px-5 py-2 bg-[var(--button-primary-background)] text-[var(--buttonText)] rounded-lg hover:bg-[var(--button-primary-background-hover)] transition-colors text-base sm:text-lg font-semibold"
            >
                Close
            </button>
        </div>
      </div>
      {/* The <style jsx global> block has been removed */}
    </div>
  );
};

export default EventModal;
