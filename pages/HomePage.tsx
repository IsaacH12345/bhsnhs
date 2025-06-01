
import React from 'react';
import Button from '../components/Button';
import InfoBox from '../components/InfoBox';
// ImagePlaceholder import removed
import useSplashText from '../hooks/useSplashText';
import { NAVIGATION_LINKS, MOCK_STATISTICS, MOCK_UPCOMING_DATES } from '../constants';
import { StatisticItem, DateItem } from '../types';

interface HomePageProps {
  onAdminAreaClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onAdminAreaClick }) => {
  const splashText = useSplashText();
  const mainNavLinks = NAVIGATION_LINKS.slice(1, 6); // Get 5 links for buttons (excluding Home)

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 flex flex-col">
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        {/* Left Column */}
        <div className="md:col-span-2 flex flex-col space-y-6">
          <header className="text-center">
            <div className="mb-2"> {/* Simplified container for title */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wider">
                BHS' NHS WEBSITE
              </h1>
            </div>
            <p className="text-lg text-indigo-300">{splashText}</p>
          </header>
          
          {/* Removed Image Placeholders section */}

          <nav className="flex flex-col space-y-3">
            {mainNavLinks.map((link) => (
              <Button key={link.id} to={link.path}>
                {link.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Right Column */}
        <div className="md:col-span-1 flex flex-col space-y-6 h-[calc(100vh-8rem)] md:h-auto">
          <div className="flex-1 min-h-[200px] md:min-h-0 md:h-1/2">
            <InfoBox title="Statistics">
              <ul className="space-y-2">
                {MOCK_STATISTICS.map((stat: StatisticItem) => (
                  <li key={stat.id} className="text-sm text-gray-300 flex justify-between">
                    <span>{stat.label}:</span>
                    <span className="font-semibold text-indigo-300">{stat.value}</span>
                  </li>
                ))}
              </ul>
            </InfoBox>
          </div>
          <div className="flex-1 min-h-[200px] md:min-h-0 md:h-1/2">
            <InfoBox title="Upcoming Dates">
              <ul className="space-y-3">
                {MOCK_UPCOMING_DATES.map((item: DateItem) => (
                  <li key={item.id} className="text-sm text-gray-300">
                    <span className="font-semibold text-indigo-300">{item.date}:</span> {item.event}
                  </li>
                ))}
              </ul>
            </InfoBox>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-6 text-right">
        <button 
          onClick={onAdminAreaClick} 
          className="text-xs text-red-400 hover:text-red-300 hover:underline focus:outline-none"
          aria-label="Admin Access"
        >
          Website By BHS NHS Dev Team
        </button>
      </footer>
    </div>
  );
};

export default HomePage;
