
import { useState, useEffect } from 'react';
import { DetailedHoursData } from '../types';

const useSplashText = (uploadedHoursData: DetailedHoursData | null): string => {
  const [splashText, setSplashText] = useState<string>('');

  useEffect(() => {
    const textsToUse = uploadedHoursData?.splashTexts;

    if (textsToUse && textsToUse.length > 0) {
      const randomIndex = Math.floor(Math.random() * textsToUse.length);
      setSplashText(textsToUse[randomIndex]);
    } else {
      setSplashText("-- NHS --"); // Default if no texts from Excel or data not loaded
    }
  }, [uploadedHoursData]); // Rerun if uploadedHoursData (and thus splashTexts) changes

  return splashText;
};

export default useSplashText;