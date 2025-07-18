
import React from 'react';
import { MeetingInfoItem } from '../types';

interface MeetingInfoCardProps {
  meeting: MeetingInfoItem;
}

const MeetingInfoCard: React.FC<MeetingInfoCardProps> = ({ meeting }) => {
  return (
    <div className="bg-[var(--infoBoxBackground)] p-4 sm:p-6 rounded-xl shadow-lg w-full">
      {/* Section 1 & 2: Title and Date on the same line */}
      <div className="flex flex-col items-start sm:flex-row sm:items-baseline mb-3">
        <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mr-3">{meeting.title}</h3>
        <p className="text-base sm:text-lg italic text-[var(--text-tertiary)]">{meeting.date}</p>
      </div>

      {/* Section 3: Times and Length details */}
      <div className="text-base sm:text-lg text-[var(--text-secondary)] space-y-2 mb-5">
        {/* Start and End Time on the same line, next to each other */}
        <p>
          Starts: <span className="font-semibold text-[var(--text-accent-info)]">{meeting.startTime}</span>
          <span className="mx-2">-</span> {/* Separator */}
          Ends: <span className="font-semibold text-[var(--text-accent-info)]">{meeting.endTime}</span>
        </p>
        {/* Length on its own line */}
        <p>Length: <span className="font-semibold text-[var(--text-accent-info)]">{meeting.length}</span></p>
      </div>
      
      {/* Section 4: Notes */}
      <div>
        <h4 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-1.5">Notes:</h4>
        <div className="text-base sm:text-lg text-[var(--text-secondary)] whitespace-pre-wrap bg-[var(--background-primary)] p-4 rounded-md max-h-72 overflow-y-auto">
          {meeting.notes}
        </div>
      </div>
    </div>
  );
};

export default MeetingInfoCard;
