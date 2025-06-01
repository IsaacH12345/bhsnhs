import { useState, useEffect } from 'react';
import { SPLASH_TEXTS } from '../data/splashTexts'; // Updated import path

const useSplashText = (): string => {
  const [splashText, setSplashText] = useState<string>('');

  useEffect(() => {
    if (SPLASH_TEXTS.length > 0) {
      const randomIndex = Math.floor(Math.random() * SPLASH_TEXTS.length);
      setSplashText(SPLASH_TEXTS[randomIndex]);
    }
  }, []);

  return splashText;
};

export default useSplashText;