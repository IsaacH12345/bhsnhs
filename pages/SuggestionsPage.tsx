
import React from 'react';
import Button from '../components/Button';
import { DetailedHoursData } from '../types';

interface SuggestionsPageProps {
  pageTitle: string; // Passed from App.tsx, usually the navigation link label
  uploadedHoursData: DetailedHoursData | null;
  isLoading: boolean;
  error: string | null;
}

const PAGE_MAIN_TITLE = "Suggestions, Ideas, and Feedback";

const SuggestionsPage: React.FC<SuggestionsPageProps> = ({ pageTitle, uploadedHoursData, isLoading, error }) => {
  const suggestionsText = uploadedHoursData?.suggestionsText;
  const suggestionsButtonUrl = uploadedHoursData?.suggestionsButtonUrl;

  const handleProvideFeedbackClick = () => {
    if (suggestionsButtonUrl) {
      window.open(suggestionsButtonUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-10 bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="mb-10 text-center w-full max-w-screen-xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)]">{PAGE_MAIN_TITLE}</h1>
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] mt-2">{pageTitle}</p>
      </header>

      <main className="flex-grow w-full max-w-3xl flex flex-col items-center justify-center"> {/* Added justify-center */}
        {isLoading && (
          <div className="bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl text-center w-full">
            <p className="text-xl text-[var(--text-secondary)]">Loading suggestions data...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl text-center w-full">
            <p className="text-xl text-[var(--text-error)] mb-4">Error loading data:</p>
            <p className="text-lg text-[var(--text-secondary)]">{error}</p>
          </div>
        )}

        {!isLoading && !error && uploadedHoursData && (
          <div className="bg-[var(--infoBoxBackground)] p-6 sm:p-8 md:p-10 rounded-xl shadow-2xl w-full">
            {suggestionsText ? (
              <p className="text-lg sm:text-xl text-center text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed mb-8">
                {suggestionsText}
              </p>
            ) : (
              <p className="text-lg sm:text-xl text-center text-[var(--text-tertiary)] mb-8">
                No information available for suggestions at this time.
              </p>
            )}

            <div className="text-center">
              <Button
                onClick={handleProvideFeedbackClick}
                disabled={!suggestionsButtonUrl}
              >
                {suggestionsButtonUrl ? "Button to Google Form" : "Feedback Link Unavailable"}
              </Button>
            </div>
          </div>
        )}
         {!isLoading && !error && !uploadedHoursData && (
             <div className="bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl text-center w-full">
                <p className="text-xl text-[var(--text-secondary)]">Suggestions data not available. Please ensure NHSExcel.xlsx is correctly formatted and loaded.</p>
             </div>
         )}
      </main>
      
      <footer className="mt-12">
        <Button to="/" className="!py-2 !px-6 !text-lg rounded-lg">
          Back to Home
        </Button>
      </footer>
    </div>
  );
};

export default SuggestionsPage;
