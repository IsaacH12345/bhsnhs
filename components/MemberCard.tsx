
import React, { useState } from 'react';
import { MemberProficiencyInfo, CourseDetail, MemberProficiencyInSubject } from '../types';

interface MemberCardProps {
  member: MemberProficiencyInfo;
}

// Helper function to determine text color (black or white) based on background hex color
const getTextColorForBackground = (hexColor: string): string => {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Calculate luminance (YIQ formula)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF'; // Black text for light backgrounds, white for dark
};


const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);

  const toggleSubjectExpansion = (subjectId: string) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  return (
    <div className="bg-[var(--infoBoxBackground)] p-5 rounded-xl shadow-lg flex flex-col items-center text-center h-full">
      {/* Member Name */}
      <h4 className="text-2xl sm:text-3xl font-semibold mb-3 text-[var(--text-accent-splash)] break-words">
        {member.name}
      </h4>
      
      {/* Proficient Subjects */}
      {member.proficienciesBySubject.length > 0 ? (
        <div className="w-full mt-2 flex flex-wrap justify-center gap-x-3 gap-y-3">
          {member.proficienciesBySubject.map((subjectProficiency) => (
            <div 
              key={subjectProficiency.subjectId} 
              className="relative" // For tooltip positioning
              onMouseLeave={() => setHoveredSubjectId(null)} // Hide tooltip when mouse leaves button area
            >
              <button
                onClick={() => {
                  toggleSubjectExpansion(subjectProficiency.subjectId);
                  setHoveredSubjectId(null); // Hide tooltip on click
                }}
                onMouseEnter={() => {
                  if (subjectProficiency.proficientCoursesInSubject.length > 0) {
                    setHoveredSubjectId(subjectProficiency.subjectId);
                  }
                }}
                style={{
                  backgroundColor: subjectProficiency.subjectColor,
                  color: getTextColorForBackground(subjectProficiency.subjectColor),
                }}
                className="inline-flex items-center px-4 py-1.5 text-sm font-semibold rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--infoBoxBackground)] focus:ring-[var(--adminModalFocusRing)] transition-colors"
                aria-expanded={!!expandedSubjects[subjectProficiency.subjectId]}
                aria-controls={`courses-${subjectProficiency.subjectId}`}
                title={subjectProficiency.subjectName} 
              >
                {subjectProficiency.subjectName} ({subjectProficiency.count})
                <span className="ml-2 text-xs">{expandedSubjects[subjectProficiency.subjectId] ? '▲' : '▼'}</span>
              </button>

              {/* Hover Tooltip */}
              {hoveredSubjectId === subjectProficiency.subjectId && subjectProficiency.proficientCoursesInSubject.length > 0 && (
                <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 p-2 bg-[var(--contentPageBoxBackground)] border border-[var(--adminModalInputBorder)] rounded-md shadow-lg z-20 min-w-[240px] max-w-sm">
                  <div className="flex flex-wrap justify-center gap-1">
                    {subjectProficiency.proficientCoursesInSubject.map(course => (
                      <span
                        key={`${course.name}-tooltip`}
                        style={{
                          backgroundColor: course.color,
                          color: getTextColorForBackground(course.color),
                        }}
                        className="px-2 py-0.5 text-xs font-medium rounded-full shadow-sm"
                        title={course.name} 
                      >
                        {course.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Click-to-Expand Course List */}
              {expandedSubjects[subjectProficiency.subjectId] && (
                <div 
                  id={`courses-${subjectProficiency.subjectId}`} 
                  className="mt-2 p-2 bg-opacity-20 bg-gray-700 rounded-md flex flex-wrap justify-center gap-1 max-w-xs mx-auto"
                >
                  {subjectProficiency.proficientCoursesInSubject.map(course => (
                    <span
                      key={course.name}
                      style={{
                        backgroundColor: course.color,
                        color: getTextColorForBackground(course.color),
                      }}
                      className="px-2 py-0.5 text-xs font-medium rounded-full shadow-sm"
                      title={course.name} 
                    >
                      {course.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--text-tertiary)] italic mt-2">No specific proficiencies listed.</p>
      )}
    </div>
  );
};

export default MemberCard;
