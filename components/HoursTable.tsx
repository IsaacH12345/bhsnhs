
import React from 'react';
import { AggregatedParsedTableData, AggregatedParsedRow } from '../types'; // Updated types

interface HoursTableProps {
  data: AggregatedParsedTableData;
  onMemberClick: (memberName: string) => void; // New prop
  currentSemester: 1 | 2 | null;
}

const displayHeadersMap: { [key: string]: string } = {
  "Member Name": "Name",
  "Semester 1 Hours": "Hours S1",
  "Semester 2 Hours": "Hours S2",
  "Total Hours": "Total Hours"
};

const getColorForMember = (row: AggregatedParsedRow, currentSemester: 1 | 2 | null): string => {
  let hours: number;
  const S1_HOURS_KEY = "Semester 1 Hours";
  const S2_HOURS_KEY = "Semester 2 Hours";

  if (currentSemester === 1) {
    hours = row[S1_HOURS_KEY] as number;
  } else if (currentSemester === 2) {
    hours = row[S2_HOURS_KEY] as number;
  } else {
    return 'text-[var(--tableTextPrimary)]'; // Default color if not in a semester
  }

  if (hours >= 5) return 'text-green-500';
  if (hours >= 1) return 'text-yellow-500'; // Covers 1-4 hours range
  return 'text-red-500'; // Covers 0 hours and anything less than 1
};


const HoursTable: React.FC<HoursTableProps> = ({ data, onMemberClick, currentSemester }) => {
  if (!data || data.rows.length === 0) {
    return <p className="text-center text-[var(--text-secondary)]">No hours data to display.</p>;
  }

  const actualHeaders = data.headers; // Keep original headers for data access

  return (
    <div className="overflow-x-auto max-h-[70vh] border border-[var(--tableBorderColor)] rounded-lg bg-[var(--adminPanelBoxBackground)] shadow-lg">
      <table className="min-w-full w-full divide-y divide-[var(--tableBorderColor)] lg:table-auto">
        <thead className="bg-[var(--tableHeaderBackground)] sticky top-0 z-10">
          <tr>
            {actualHeaders.map((headerKey) => (
              <th 
                key={headerKey} 
                scope="col"
                className={`py-3 px-2 sm:py-4 sm:px-4 md:px-6 text-base sm:text-lg font-semibold text-[var(--tableTextHeader)] uppercase tracking-wider whitespace-nowrap ${headerKey === "Member Name" ? `text-left sticky left-0 bg-[var(--tableHeaderBackground)] z-20` : `text-center`}`}
                style={
                  headerKey === "Member Name" ? { minWidth: '120px' } : 
                  headerKey === "Total Hours" ? { minWidth: '60px' } : 
                  { minWidth: '45px' }
                } 
              >
                {displayHeadersMap[headerKey] || headerKey}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--tableBorderColor)]">
          {data.rows.map((row, rowIndex) => (
            <tr 
              key={rowIndex} 
              className={`${rowIndex % 2 === 0 ? 'bg-[var(--tableRowEvenBackground)]' : 'bg-[var(--tableRowOddBackground)]'} hover:bg-opacity-70`}
            >
              {actualHeaders.map((headerKey) => (
                <td 
                  key={`${rowIndex}-${headerKey}`}
                  className={`py-3 px-2 sm:py-4 sm:px-4 md:px-6 whitespace-nowrap text-sm sm:text-lg truncate ${
                    headerKey === "Member Name" 
                      ? `text-left sticky left-0 z-10 font-medium cursor-pointer hover:underline ${getColorForMember(row, currentSemester)}` 
                      : `text-center text-[var(--tableTextPrimary)]`
                  }`}
                  style={headerKey === "Member Name" ? {
                    backgroundColor: rowIndex % 2 === 0 ? 'var(--tableRowEvenBackground)' : 'var(--tableRowOddBackground)',
                  } : {}}
                  onClick={headerKey === "Member Name" ? () => onMemberClick(row[headerKey] as string) : undefined}
                  role={headerKey === "Member Name" ? "button" : undefined}
                  tabIndex={headerKey === "Member Name" ? 0 : undefined}
                  onKeyDown={headerKey === "Member Name" ? (e) => { if (e.key === 'Enter' || e.key === ' ') onMemberClick(row[headerKey] as string); } : undefined}
                  aria-label={headerKey === "Member Name" ? `View details for ${row[headerKey]}` : undefined}
                  title={row[headerKey]?.toString()} // Added title for potentially truncated text
                >
                  {typeof row[headerKey] === 'number' ? (row[headerKey] as number).toFixed(1) : row[headerKey]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HoursTable;
