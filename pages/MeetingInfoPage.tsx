
import React, { useState, useMemo } from 'react';
import Button from '../components/Button';
import MeetingInfoCard from '../components/MeetingInfoCard';
import { DetailedHoursData, MeetingInfoItem } from '../types';

interface MeetingInfoPageProps {
  pageTitle: string;
  uploadedHoursData: DetailedHoursData | null;
  isLoading: boolean;
  error: string | null;
}

const PAGE_MAIN_TITLE = "NHS Meeting Information";

const MeetingInfoPage: React.FC<MeetingInfoPageProps> = ({ pageTitle, uploadedHoursData, isLoading, error }) => {
  const [selectedTitleFilter, setSelectedTitleFilter] = useState<string>('');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('');

  const meetingInfoData = uploadedHoursData?.meetingInfo;

  const uniqueTitles = useMemo(() => {
    if (!meetingInfoData) return [];
    const titles = new Set(meetingInfoData.map(item => item.title));
    return Array.from(titles).sort();
  }, [meetingInfoData]);

  const uniqueDates = useMemo(() => {
    if (!meetingInfoData) return [];
    // Sort by rawDate before creating unique display dates to ensure chronological order in dropdown
    const sortedByDate = [...meetingInfoData].sort((a, b) => {
        if (a.rawDate && b.rawDate) return b.rawDate.getTime() - a.rawDate.getTime(); // Desc for recent first
        if (a.rawDate) return -1;
        if (b.rawDate) return 1;
        return 0;
    });
    const dates = new Set(sortedByDate.map(item => item.date));
    return Array.from(dates); // Already sorted by virtue of processing sortedByDate
  }, [meetingInfoData]);

  const filteredMeetings = useMemo(() => {
    if (!meetingInfoData) return [];
    let meetings = meetingInfoData;

    if (selectedTitleFilter) {
      meetings = meetings.filter(item => item.title === selectedTitleFilter);
    }
    if (selectedDateFilter) {
      meetings = meetings.filter(item => item.date === selectedDateFilter);
    }
    // Sort final list by date, most recent first
    return meetings.sort((a, b) => {
        if (a.rawDate && b.rawDate) return b.rawDate.getTime() - a.rawDate.getTime();
        if (a.rawDate) return -1; // Place items with dates before those without
        if (b.rawDate) return 1;
        return 0; // Keep original order if dates are same or both null
    });
  }, [meetingInfoData, selectedTitleFilter, selectedDateFilter]);

  const clearFilters = () => {
    setSelectedTitleFilter('');
    setSelectedDateFilter('');
  };
  
  const anyFilterActive = selectedTitleFilter || selectedDateFilter;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 sm:p-10 bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="mb-8 text-center w-full max-w-screen-xl">
        <div className="flex justify-start w-full mb-4">
          <Button to="/" className="!py-2 !px-6 !text-lg !font-semibold rounded-lg">
            &larr; Back to Home
          </Button>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-[var(--text-primary)]">{PAGE_MAIN_TITLE}</h1>
        {pageTitle !== PAGE_MAIN_TITLE && <p className="text-xl text-[var(--text-secondary)] mt-2">{pageTitle}</p>}
      </header>

      <main className="flex-grow w-full max-w-screen-lg">
        {/* Filter Section */}
        {meetingInfoData && meetingInfoData.length > 0 && (
          <div className="mb-8 p-4 bg-[var(--infoBoxBackground)] rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row gap-4 items-center mb-3">
              <select
                value={selectedTitleFilter}
                onChange={(e) => setSelectedTitleFilter(e.target.value)}
                className="w-full sm:w-1/2 px-4 py-3 bg-[var(--adminModalInputBackground)] border border-[var(--adminModalInputBorder)] rounded-lg text-[var(--text-primary)] text-lg focus:ring-2 focus:ring-[var(--adminModalFocusRing)] outline-none"
                aria-label="Filter by meeting title"
              >
                <option value="">Filter by Title...</option>
                {uniqueTitles.map(title => <option key={title} value={title}>{title}</option>)}
              </select>
              <select
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
                className="w-full sm:w-1/2 px-4 py-3 bg-[var(--adminModalInputBackground)] border border-[var(--adminModalInputBorder)] rounded-lg text-[var(--text-primary)] text-lg focus:ring-2 focus:ring-[var(--adminModalFocusRing)] outline-none"
                aria-label="Filter by meeting date"
              >
                <option value="">Filter by Date...</option>
                {uniqueDates.map(date => <option key={date} value={date}>{date}</option>)}
              </select>
            </div>
            {anyFilterActive && (
                 <div className="text-right">
                    <button 
                        onClick={clearFilters} 
                        className="px-4 py-2 text-sm font-medium rounded-md shadow-sm bg-[var(--button-primary-background)] text-[var(--buttonText)] hover:bg-[var(--button-primary-background-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--button-ring)]"
                    >
                        Clear Filters
                    </button>
                 </div>
            )}
          </div>
        )}

        {/* Meeting Cards Display Area */}
        {isLoading && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-secondary)]">Loading meeting information...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-error)] mb-4">Error loading data:</p>
            <p className="text-lg text-[var(--text-secondary)]">{error}</p>
          </div>
        )}
        {!isLoading && !error && filteredMeetings && filteredMeetings.length > 0 && (
          <div className="space-y-6">
            {filteredMeetings.map(meeting => (
              <MeetingInfoCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        )}
        {!isLoading && !error && (!filteredMeetings || filteredMeetings.length === 0) && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl mt-8">
            <p className="text-xl text-[var(--text-secondary)]">
              {anyFilterActive
                ? "No meetings match your current filters." 
                : 'No meeting information found. Please check the "MeetingInfo" sheet in NHSExcel.xlsx.'}
            </p>
          </div>
        )}
         {!isLoading && !error && !meetingInfoData && ( // Case where meetingInfoData itself is null/undefined after loading
            <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl mt-8">
                <p className="text-xl text-[var(--text-secondary)]">
                    Meeting information is currently unavailable.
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

export default MeetingInfoPage;
