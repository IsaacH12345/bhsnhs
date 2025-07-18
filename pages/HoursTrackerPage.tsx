
import React, { useState, useMemo, useEffect, useRef } from 'react';
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

// Declare jsPDF types from CDN
declare const jspdf: any;

// Helper to determine text color for a given background
const getTextColorForBackground = (hexColor: string): '#000000' | '#FFFFFF' => {
  if (!hexColor) return '#000000';
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Using YIQ formula to determine luminance
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#000000' : '#FFFFFF';
};

const HoursTrackerPage: React.FC<HoursTrackerPageProps> = ({ navigationPageTitle, uploadedHoursData, isLoading, error }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMemberName, setSelectedMemberName] = useState<string | null>(null);
  const [isPdfMenuOpen, setIsPdfMenuOpen] = useState<boolean>(false);
  const [pdfFilterOptions, setPdfFilterOptions] = useState({
    green: true,  // 5+ hours
    yellow: true, // 1-4 hours
    red: true,    // 0 hours
  });
  const [pdfSortOption, setPdfSortOption] = useState<'name' | 'hours'>('name');
  const [pdfSemesterOption, setPdfSemesterOption] = useState<'s1' | 's2' | 'both'>('s1');

  const pdfMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pdfMenuRef.current && !pdfMenuRef.current.contains(event.target as Node)) {
        setIsPdfMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setSelectedMemberName(null); 
  };

  const handleMemberSelect = (memberName: string) => {
    setSelectedMemberName(memberName);
  };

  const handlePdfFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;
    setPdfFilterOptions(prev => ({ ...prev, [name]: checked }));
  };

  const handlePdfSortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPdfSortOption(event.target.value as 'name' | 'hours');
  };
  
  const handlePdfSemesterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPdfSemesterOption(event.target.value as 's1' | 's2' | 'both');
  };

  const currentSemester = useMemo((): 1 | 2 | null => {
    if (!uploadedHoursData?.sem1StartDate) {
      return null;
    }
    const now = new Date();
    const { sem1StartDate, sem2StartDate } = uploadedHoursData;

    if (sem2StartDate && now >= sem2StartDate) {
      return 2;
    }
    if (sem1StartDate && now >= sem1StartDate) {
      return 1;
    }

    return null;
  }, [uploadedHoursData]);

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

  const handleDownloadPdf = () => {
    if (!uploadedHoursData) return;

    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });

    const COLORS = {
      GREEN_BG: '#4CAF50',
      YELLOW_BG: '#FFC107',
      RED_BG: '#F44336',
    };

    const isBothMode = pdfSemesterOption === 'both';
    
    // 1. Determine which hours to use for filtering and sorting
    const getHours = (member: MemberDetailedHours) => {
        if (isBothMode) return member.totalHours;
        return pdfSemesterOption === 's1' ? member.semester1Hours : member.semester2Hours;
    }

    // 2. Filter members based on selected criteria
    const membersToFilter = uploadedHoursData.members.filter(member => {
      const hours = getHours(member);
        
      if (hours >= 5 && pdfFilterOptions.green) return true;
      if (hours >= 1 && hours < 5 && pdfFilterOptions.yellow) return true;
      if (hours < 1 && pdfFilterOptions.red) return true;
      return false;
    });

    // 3. Sort members
    const membersToInclude = [...membersToFilter].sort((a, b) => {
      if (pdfSortOption === 'hours') {
        return getHours(b) - getHours(a);
      }
      return a.memberName.localeCompare(b.memberName);
    });

    if (membersToInclude.length === 0) {
      alert("No members match the selected criteria.");
      return;
    }

    // 4. Draw header and tables
    doc.setFontSize(18);
    doc.setTextColor(40);
    const title = `NHS Tutoring Hours Report: ${
      isBothMode ? 'All Semesters (by Total)' : `Semester ${pdfSemesterOption === 's1' ? '1' : '2'}`
    }`;
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 12, { align: 'center' });

    const tableStyles = {
        halign: 'center', valign: 'middle', fontSize: 8, cellPadding: 1,
        lineWidth: 0.1, lineColor: '#444444',
    };
    const headStyles = {
        fillColor: '#282C34', textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 8,
    };

    if (isBothMode) {
      // Single wide table for "Both"
      const tableData = membersToInclude.map(m => [m.memberName, m.semester1Hours, m.semester2Hours, m.totalHours]);
      doc.autoTable({
        head: [['Member Name', 'S1 Hours', 'S2 Hours', 'Total Hours']],
        body: tableData,
        startY: 18, styles: tableStyles, headStyles: headStyles,
        columnStyles: {
            0: { cellWidth: '40%', halign: 'left' },
            1: { cellWidth: '20%', halign: 'center' },
            2: { cellWidth: '20%', halign: 'center' },
            3: { cellWidth: '20%', halign: 'center' }
        },
        willDrawCell: (data: any) => {
          if (data.section === 'body') {
            const memberData = membersToInclude[data.row.index];
            if (!memberData) return;
            let fillColor = '';
            let hours = 0;
            // Column 1 is S1 Hours, Column 2 is S2 Hours
            if (data.column.index === 1) hours = memberData.semester1Hours;
            if (data.column.index === 2) hours = memberData.semester2Hours;

            if (data.column.index === 1 || data.column.index === 2) {
              if (hours >= 5) fillColor = COLORS.GREEN_BG;
              else if (hours >= 1) fillColor = COLORS.YELLOW_BG;
              else fillColor = COLORS.RED_BG;
            }
            if (fillColor) {
              doc.setFillColor(fillColor);
              doc.setTextColor(getTextColorForBackground(fillColor));
            }
          }
        },
        didParseCell: (data: any) => {
          if (data.section === 'body' && typeof data.cell.raw === 'number') {
            data.cell.text = [data.cell.raw.toFixed(1)];
          }
        }
      });
    } else {
      // Two-column layout for S1 or S2
      const semesterKey = pdfSemesterOption === 's1' ? 'semester1Hours' : 'semester2Hours';
      const tableData = membersToInclude.map(m => [m.memberName, m[semesterKey].toFixed(1)]);
      const midPoint = Math.ceil(tableData.length / 2);
      const leftColumnBody = tableData.slice(0, midPoint);
      const rightColumnBody = tableData.slice(midPoint);
      const leftColumnMembers = membersToInclude.slice(0, midPoint);
      const rightColumnMembers = membersToInclude.slice(midPoint);

      const drawColoredTable = (body: any[], members: any[], startX: number, tableWidth: number) => {
        doc.autoTable({
          head: [['Member Name', `S${pdfSemesterOption === 's1' ? 1 : 2} Hours`]],
          body: body, startY: 18, margin: { left: startX }, tableWidth: tableWidth,
          styles: tableStyles, headStyles: headStyles,
          columnStyles: {
            0: { cellWidth: '75%', halign: 'left' },
            1: { cellWidth: '25%', halign: 'center' },
          },
          willDrawCell: (data: any) => {
            if (data.section === 'body') {
              const memberData = members[data.row.index];
              if (!memberData) return;
              const hours = memberData[semesterKey];
              let fillColor = '';
              if (hours >= 5) fillColor = COLORS.GREEN_BG;
              else if (hours >= 1) fillColor = COLORS.YELLOW_BG;
              else fillColor = COLORS.RED_BG;
              doc.setFillColor(fillColor);
              doc.setTextColor(getTextColorForBackground(fillColor));
            }
          }
        });
      };
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const gap = 5;
      const tableWidth = (pageWidth - (margin * 2) - gap) / 2;
      
      drawColoredTable(leftColumnBody, leftColumnMembers, margin, tableWidth);
      if (rightColumnBody.length > 0) {
        drawColoredTable(rightColumnBody, rightColumnMembers, margin + tableWidth + gap, tableWidth);
      }
    }

    const date = new Date().toLocaleDateString('en-CA');
    doc.save(`nhs-hours-report-${pdfSemesterOption}-${date}.pdf`);
    setIsPdfMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-10 bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="mb-8 md:mb-10 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)]">{PAGE_MAIN_TITLE}</h1>
      </header>

      <main className="flex-grow flex flex-col items-center w-full">
        <div className="w-full max-w-screen-xl flex flex-col lg:flex-row gap-8">
          {/* Left Column: Search, PDF Controls, and Details */}
          <div className="lg:w-1/2 flex flex-col gap-8">
            <div className="w-full">
              <input
                type="search"
                placeholder="Search for a member..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-[var(--adminModalInputBackground)] border border-[var(--adminModalInputBorder)] rounded-lg text-[var(--text-primary)] text-lg sm:text-xl focus:ring-2 focus:ring-[var(--adminModalFocusRing)] focus:border-[var(--adminModalFocusRing)] outline-none transition-colors"
                aria-label="Search for a member"
              />
            </div>
            
            {/* PDF Download Dropdown */}
            <div className="relative w-full" ref={pdfMenuRef}>
              <Button
                onClick={() => setIsPdfMenuOpen(prev => !prev)}
                disabled={isLoading}
                className="w-full !py-3 !px-6 !text-lg sm:!text-xl !font-semibold rounded-lg"
                aria-haspopup="true"
                aria-expanded={isPdfMenuOpen}
              >
                {isLoading ? 'Data Loading...' : 'Download Report PDF'}
              </Button>
              {isPdfMenuOpen && (
                <div className="absolute top-full mt-2 w-full bg-[var(--infoBoxBackground)] p-4 sm:p-6 rounded-lg shadow-xl z-20 border border-[var(--tableBorderColor)]">
                  <p className="text-sm text-[var(--text-tertiary)] mb-4">
                    Select criteria for the PDF report.
                  </p>

                  <div className="mb-5 border-b border-[var(--tableBorderColor)] pb-5">
                    <h3 className="font-semibold text-base sm:text-lg mb-3 text-[var(--text-primary)]">Semester Data</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <label className="flex items-center text-base sm:text-lg text-[var(--text-secondary)] cursor-pointer">
                        <input type="radio" name="semester" value="s1" checked={pdfSemesterOption === 's1'} onChange={handlePdfSemesterChange} className="h-5 w-5 mr-2 text-blue-500 focus:ring-blue-400 bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)]"/>
                        Semester 1
                      </label>
                      <label className="flex items-center text-base sm:text-lg text-[var(--text-secondary)] cursor-pointer">
                        <input type="radio" name="semester" value="s2" checked={pdfSemesterOption === 's2'} onChange={handlePdfSemesterChange} className="h-5 w-5 mr-2 text-blue-500 focus:ring-blue-400 bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)]"/>
                        Semester 2
                      </label>
                       <label className="flex items-center text-base sm:text-lg text-[var(--text-secondary)] cursor-pointer">
                        <input type="radio" name="semester" value="both" checked={pdfSemesterOption === 'both'} onChange={handlePdfSemesterChange} className="h-5 w-5 mr-2 text-blue-500 focus:ring-blue-400 bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)]"/>
                        Both
                      </label>
                    </div>
                  </div>
                  
                  <div className="mb-5 border-b border-[var(--tableBorderColor)] pb-5">
                    <h3 className="font-semibold text-base sm:text-lg mb-3 text-[var(--text-primary)]">
                      {pdfSemesterOption === 'both'
                        ? 'Include Members (by total hours)'
                        : 'Include Members (by selected semester hours)'}
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center text-base sm:text-lg text-[var(--text-secondary)] cursor-pointer">
                        <input type="checkbox" name="green" checked={pdfFilterOptions.green} onChange={handlePdfFilterChange} className="h-5 w-5 mr-3 rounded text-green-500 focus:ring-green-400 bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)]"/>
                        With 5+ hours (Green)
                      </label>
                      <label className="flex items-center text-base sm:text-lg text-[var(--text-secondary)] cursor-pointer">
                        <input type="checkbox" name="yellow" checked={pdfFilterOptions.yellow} onChange={handlePdfFilterChange} className="h-5 w-5 mr-3 rounded text-yellow-500 focus:ring-yellow-400 bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)]"/>
                        With 1-4 hours (Yellow)
                      </label>
                      <label className="flex items-center text-base sm:text-lg text-[var(--text-secondary)] cursor-pointer">
                        <input type="checkbox" name="red" checked={pdfFilterOptions.red} onChange={handlePdfFilterChange} className="h-5 w-5 mr-3 rounded text-red-500 focus:ring-red-400 bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)]"/>
                        With 0 hours (Red)
                      </label>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-semibold text-base sm:text-lg mb-3 text-[var(--text-primary)]">Sort By</h3>
                    <div className="flex gap-x-6 gap-y-2">
                      <label className="flex items-center text-base sm:text-lg text-[var(--text-secondary)] cursor-pointer">
                        <input type="radio" name="sort" value="name" checked={pdfSortOption === 'name'} onChange={handlePdfSortChange} className="h-5 w-5 mr-2 text-blue-500 focus:ring-blue-400 bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)]"/>
                        Name
                      </label>
                      <label className="flex items-center text-base sm:text-lg text-[var(--text-secondary)] cursor-pointer">
                        <input type="radio" name="sort" value="hours" checked={pdfSortOption === 'hours'} onChange={handlePdfSortChange} className="h-5 w-5 mr-2 text-blue-500 focus:ring-blue-400 bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)]"/>
                        {pdfSemesterOption === 'both' ? 'Total Hours' : 'Hours'}
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={handleDownloadPdf}
                    disabled={Object.values(pdfFilterOptions).every(v => !v)}
                    className="w-full !py-3 !px-6 !text-base sm:!text-lg !font-semibold rounded-lg"
                  >
                    Generate PDF
                  </Button>
                </div>
              )}
            </div>

            {selectedMemberDetails && (
              <>
                <div className="bg-[var(--infoBoxBackground)] p-4 sm:p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-[var(--text-primary)]">{selectedMemberDetails.memberName}'s Tutoring Hours</h2>
                  {selectedMemberDetails.dailyDetails.length > 0 ? (
                    <div className="max-h-[30vh] overflow-y-auto pr-2 text-base sm:text-lg">
                      <ul className="space-y-2"> 
                        {selectedMemberDetails.dailyDetails.map((detail, index) => (
                          <li key={index} className="text-[var(--text-secondary)] break-words"> 
                            Date: {detail.date} | Session: {detail.session} | Sem: {detail.semester} | Hours: {detail.hours.toFixed(1)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-[var(--text-tertiary)] text-base sm:text-lg">No daily tutoring details available for this member.</p>
                  )}
                </div>

                {selectedMemberDetails.additionalHourDetails && selectedMemberDetails.additionalHourDetails.length > 0 && (
                  <div className="bg-[var(--infoBoxBackground)] p-4 sm:p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-[var(--text-primary)]">{selectedMemberDetails.memberName}'s Additional Hours</h2>
                    <div className="max-h-[30vh] overflow-y-auto pr-2 text-base sm:text-lg">
                      <ul className="space-y-2">
                        {selectedMemberDetails.additionalHourDetails.map((detail, index) => (
                          <li key={`add-${index}`} className="text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                            Date: {detail.date} | Hours: {detail.hours.toFixed(1)} | Sem: {detail.semester} | Notes: {detail.notes || 'N/A'}
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
                <HoursTable data={filteredAndAggregatedTableData} onMemberClick={handleMemberSelect} currentSemester={currentSemester} />
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
          <Button to="/" className="!py-2 !px-6 !text-lg rounded-lg">
            Back to Home
          </Button>
        </div>
      </main>
      
      <footer className="mt-auto pt-8 text-center">
        <p className="text-base sm:text-lg text-[var(--text-tertiary)]"> 
          Click on a member's name to see a detailed list of their hours.
        </p>
      </footer>
    </div>
  );
};

export default HoursTrackerPage;
