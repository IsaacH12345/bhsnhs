
import React, { useState, useMemo } from 'react';
import Button from '../components/Button';
import HoursTable from '../components/HoursTable'; 
import { DetailedHoursData, MemberDetailedHours, DailyHourDetail, AggregatedParsedTableData, AggregatedParsedRow } from '../types';

interface HoursTrackerPageProps {
  navigationPageTitle: string;
  uploadedHoursData: DetailedHoursData | null;
  isLoading: boolean; 
  error: string | null;   
}

const PAGE_MAIN_TITLE = "BHS's NHS Tutoring Hours Tracker";

const HoursTrackerPage: React.FC<HoursTrackerPageProps> = ({ navigationPageTitle, uploadedHoursData, isLoading, error }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setSelectedMemberName(null); 
  };

  const handleMemberSelect = (memberName: string) => {
    setSelectedMemberName(memberName);
  };

  const selectedMemberDetails: MemberDetailedHours | undefined = useMemo(() => {
    if (!selectedMemberName || !uploadedHoursData) return undefined;
    return uploadedHoursData.members.find(member => member.memberName === selectedMemberName);
  }, [selectedMemberName, uploadedHoursData]);

  const filteredAndAggregatedTableData: AggregatedParsedTableData | null = useMemo(() => {
    if (!uploadedHoursData) return null;

    const filteredMembers = uploadedHoursData.members.filter(member =>
      member.memberName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
      headers: uploadedHoursData.aggregatedHeaders,
      rows: filteredMembers.map(member => ({
        "Member Name": member.memberName,
        "Semester 1 Hours": member.semester1Hours,
        "Semester 2 Hours": member.semester2Hours,
        "Total Hours": member.totalHours,
      } as AggregatedParsedRow)),
    };
  }, [uploadedHoursData, searchTerm]);


  return (
    <div className="min-h-screen flex flex-col p-6 sm:p-10 bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="mb-10 text-center">
        <h1 className="text-5xl sm:text-6xl font-bold text-[var(--text-primary)]">{PAGE_MAIN_TITLE}</h1>
      </header>

      <main className="flex-grow flex flex-col items-center w-full">
        <div className="w-full max-w-screen-xl flex flex-col lg:flex-row gap-8">
          {/* Left Column: Search and Details */}
          <div className="lg:w-1/2 flex flex-col gap-8">
            <div className="w-full">
              <input
                type="search"
                placeholder="Search for a member..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-5 py-4 bg-[var(--adminModalInputBackground)] border border-[var(--adminModalInputBorder)] rounded-lg text-[var(--text-primary)] text-xl focus:ring-2 focus:ring-[var(--adminModalFocusRing)] focus:border-[var(--adminModalFocusRing)] outline-none transition-colors"
                aria-label="Search for a member"
              />
            </div>

            {selectedMemberDetails && (
              <>
                <div className="bg-[var(--infoBoxBackground)] p-6 rounded-lg shadow-md">
                  <h2 className="text-3xl font-semibold mb-4 text-[var(--text-primary)]">{selectedMemberDetails.memberName}'s Tutoring Hours</h2>
                  {selectedMemberDetails.dailyDetails.length > 0 ? (
                    <div className="max-h-[30vh] overflow-y-auto pr-2 text-lg">
                      <ul className="space-y-2"> 
                        {selectedMemberDetails.dailyDetails.map((detail, index) => (
                          <li key={index} className="text-[var(--text-secondary)] whitespace-nowrap"> 
                            Date: {detail.date} | Session: {detail.session} | Semester: {detail.semester} | Hours: {detail.hours.toFixed(1)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-[var(--text-tertiary)] text-lg">No daily tutoring details available for this member.</p>
                  )}
                </div>

                {selectedMemberDetails.additionalHourDetails && selectedMemberDetails.additionalHourDetails.length > 0 && (
                  <div className="bg-[var(--infoBoxBackground)] p-6 rounded-lg shadow-md">
                    <h2 className="text-3xl font-semibold mb-4 text-[var(--text-primary)]">{selectedMemberDetails.memberName}'s Additional Hours</h2>
                    <div className="max-h-[30vh] overflow-y-auto pr-2 text-lg">
                      <ul className="space-y-2">
                        {selectedMemberDetails.additionalHourDetails.map((detail, index) => (
                          <li key={`add-${index}`} className="text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                            Date: {detail.date} | Hours: {detail.hours.toFixed(1)} | Semester: {detail.semester} | Notes: {detail.notes || 'N/A'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Main Table */}
          <div className="lg:w-2/3">
            {isLoading && (
              <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl mt-4 lg:mt-0">
                 <p className="text-xl text-[var(--text-secondary)]">Loading spreadsheet data...</p>
              </div>
            )}
            {!isLoading && error && (
              <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl mt-4 lg:mt-0">
                <p className="text-xl text-[var(--text-error)] mb-4">Error loading spreadsheet:</p>
                <p className="text-lg text-[var(--text-secondary)]">{error}</p>
              </div>
            )}
            {!isLoading && !error && uploadedHoursData ? (
              filteredAndAggregatedTableData && filteredAndAggregatedTableData.rows.length > 0 ? (
                <HoursTable data={filteredAndAggregatedTableData} onMemberClick={handleMemberSelect} />
              ) : (
                <p className="text-center text-xl text-[var(--text-secondary)] mt-4">
                  {searchTerm ? "No members match your search." : "No hours data found in NHSExcel.xlsx or the file is empty."}
                </p>
              )
            ) : (
              !isLoading && !error && ( 
                <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl mt-4 lg:mt-0">
                  <p className="text-xl text-[var(--text-secondary)] mb-8">
                    No hours data found. Ensure NHSExcel.xlsx is present in the website's root directory and correctly formatted.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
        
        <div className="mt-12">
          <Button to="/" className="!py-3 !px-8 !text-xl !font-semibold rounded-lg">
            Back to Home
          </Button>
        </div>
      </main>
      
      <footer className="mt-auto pt-8 text-center">
        <p className="text-lg text-[var(--text-tertiary)]"> 
          Click on a member's name to see a detailed list of their hours.
        </p>
      </footer>
    </div>
  );
};

export default HoursTrackerPage;