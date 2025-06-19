
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import OfficerCard from '../components/OfficerCard';
import { DetailedHoursData, OfficerInfo } from '../types';

interface OfficerDetailsPageProps {
  pageTitle: string;
  uploadedHoursData: DetailedHoursData | null;
  isLoading: boolean;
  error: string | null;
}

const PAGE_MAIN_TITLE = "BHS' NHS Officers"; // As seen in the image

const OfficerDetailsPage: React.FC<OfficerDetailsPageProps> = ({ pageTitle, uploadedHoursData, isLoading, error }) => {
  const officerDetails = uploadedHoursData?.officerDetails;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 sm:p-10 bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="mb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-[var(--text-primary)]">{PAGE_MAIN_TITLE}</h1>
      </header>

      <main className="flex-grow w-full max-w-screen-2xl">
        {isLoading && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-secondary)]">Loading officer data...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-error)] mb-4">Error loading data:</p>
            <p className="text-lg text-[var(--text-secondary)]">{error}</p>
          </div>
        )}
        {!isLoading && !error && officerDetails && officerDetails.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {officerDetails.map(officer => (
              <OfficerCard key={officer.id} officer={officer} />
            ))}
          </div>
        )}
        {!isLoading && !error && (!officerDetails || officerDetails.length === 0) && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-secondary)]">
              No officer details found. Please check the "Officers" sheet in NHSExcel.xlsx.
            </p>
          </div>
        )}
      </main>
      
      <footer className="mt-12">
        <Button to="/" className="!py-3 !px-8 !text-xl !font-semibold rounded-lg">
          Back to Home
        </Button>
      </footer>
    </div>
  );
};

export default OfficerDetailsPage;