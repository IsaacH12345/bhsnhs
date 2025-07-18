
import React, { useState, useEffect } from 'react';
import { OfficerInfo } from '../types';

interface OfficerCardProps {
  officer: OfficerInfo;
}

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const OfficerCard: React.FC<OfficerCardProps> = ({ officer }) => {
  const primaryImageSrc = officer.imageBase64 && officer.imageBase64.startsWith('data:image')
    ? officer.imageBase64
    : (officer.imageBase64 && officer.imageBase64 !== TRANSPARENT_PIXEL ? `data:image/png;base64,${officer.imageBase64}` : TRANSPARENT_PIXEL);

  const secondaryImageSrc = officer.secondaryImageBase64 && officer.secondaryImageBase64.startsWith('data:image')
    ? officer.secondaryImageBase64
    : (officer.secondaryImageBase64 && officer.secondaryImageBase64 !== TRANSPARENT_PIXEL ? `data:image/png;base64,${officer.secondaryImageBase64}` : TRANSPARENT_PIXEL);

  const [showPrimary, setShowPrimary] = useState(true);

  useEffect(() => {
    if (!secondaryImageSrc || secondaryImageSrc === TRANSPARENT_PIXEL) {
      return; // No secondary image or it's transparent, so no cycling.
    }

    const intervalId = setInterval(() => {
      setShowPrimary(prev => !prev);
    }, 10000); // Cycle every 10 seconds

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [secondaryImageSrc]); // Re-run effect if secondaryImageSrc changes (though unlikely for this use case)

  return (
    <div className="bg-[var(--infoBoxBackground)] p-4 sm:p-6 rounded-xl shadow-lg text-center flex flex-col items-center h-full">
      {/* 1. Role */}
      <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-[var(--text-primary)]">{officer.role}</h3>
      
      {/* 2. Picture Container */}
      <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[var(--text-accent-info)] shadow-md mb-4 overflow-hidden">
        <img
          src={primaryImageSrc}
          alt={`Profile picture of ${officer.name}, ${officer.role} (Primary)`}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${showPrimary ? 'opacity-100' : 'opacity-0'}`}
          onError={(e) => (e.currentTarget.src = TRANSPARENT_PIXEL)}
        />
        {secondaryImageSrc && secondaryImageSrc !== TRANSPARENT_PIXEL && (
          <img
            src={secondaryImageSrc}
            alt={`Profile picture of ${officer.name}, ${officer.role} (Secondary)`}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${!showPrimary ? 'opacity-100' : 'opacity-0'}`}
            onError={(e) => (e.currentTarget.src = TRANSPARENT_PIXEL)}
          />
        )}
      </div>
      
      {/* 3. Name */}
      <h4 className="text-xl sm:text-2xl font-semibold mb-1 text-[var(--text-accent-splash)]">{officer.name}</h4>
      
      {/* 4. Description */}
      <div className="flex-grow max-h-30 overflow-y-auto mb-2 pr-1">
        <p className="text-sm sm:text-base text-[var(--text-secondary)] text-center leading-relaxed whitespace-pre-wrap">
          {officer.description}
        </p>
      </div>
      
      {/* 5. Email */}
      {officer.email && (
        <p className="text-xs sm:text-sm italic text-[var(--text-tertiary)] mt-auto break-all">
          {officer.email}
        </p>
      )}
    </div>
  );
};

export default OfficerCard;
