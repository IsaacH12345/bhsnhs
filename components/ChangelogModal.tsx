
import React, { useState, useEffect } from 'react';
import { DynamicListItem } from '../types';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
  updates: DynamicListItem[];
}

const MODAL_ANIMATION_STYLE_ID = 'changelog-modal-animation-styles';

const ChangelogModal: React.FC<ChangelogModalProps> = ({ isOpen, onClose, updates }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0); // Reset to first item when modal opens
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
    return () => {
      if (isOpen) {
        const existingStyleElement = document.getElementById(MODAL_ANIMATION_STYLE_ID);
        if (existingStyleElement) {
           existingStyleElement.remove();
        }
      }
    };
  }, [isOpen]);

  if (!isOpen || !updates || updates.length === 0) return null;

  const currentUpdate = updates[currentIndex];

  const nextUpdate = () => {
    if (currentIndex < updates.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevUpdate = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelogModalTitle"
    >
      <div 
        className="bg-[var(--infoBoxBackground)] p-6 sm:p-8 rounded-xl shadow-2xl max-w-lg w-full transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modalFadeInScale flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '80vh' }} 
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="changelogModalTitle" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Website Changelog</h3>
          <button 
            onClick={onClose} 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="flex-grow overflow-y-auto mb-6 pr-2">
          {currentUpdate ? (
            <>
              <p className="text-xl text-[var(--text-accent-info)] font-semibold mb-2">
                {currentUpdate.date}
              </p>
              <p className="text-lg text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                {currentUpdate.content}
              </p>
            </>
          ) : (
            <p className="text-lg text-center text-[var(--text-secondary)]">No changelog entry found.</p>
          )}
        </div>
        
        <div className="mt-auto pt-4 border-t border-[var(--tableBorderColor)]">
          {updates.length > 1 && (
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={prevUpdate} 
                disabled={currentIndex === 0}
                className="px-4 py-2 bg-[var(--button-primary-background)] text-[var(--buttonText)] rounded-lg disabled:opacity-50 hover:bg-[var(--button-primary-background-hover)] transition-colors text-md font-semibold"
                aria-label="Previous changelog entry"
              >
                Prev
              </button>
              <span className="text-md text-[var(--text-tertiary)]">
                {currentIndex + 1} / {updates.length}
              </span>
              <button 
                onClick={nextUpdate} 
                disabled={currentIndex === updates.length - 1}
                className="px-4 py-2 bg-[var(--button-primary-background)] text-[var(--buttonText)] rounded-lg disabled:opacity-50 hover:bg-[var(--button-primary-background-hover)] transition-colors text-md font-semibold"
                aria-label="Next changelog entry"
              >
                Next
              </button>
            </div>
          )}
          <div className="text-right">
            <button
                onClick={onClose}
                className="px-5 py-2 bg-[var(--button-primary-background)] text-[var(--buttonText)] rounded-lg hover:bg-[var(--button-primary-background-hover)] transition-colors text-lg font-semibold"
            >
                Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangelogModal;