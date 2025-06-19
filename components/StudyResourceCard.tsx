
import React from 'react';
import { StudyResource } from '../types';
import Button from './Button'; // Assuming Button component can be used for the link

interface StudyResourceCardProps {
  resource: StudyResource;
  isExpanded: boolean;
  onToggleExpansion: (resourceId: string) => void;
}

const MAX_DESC_LENGTH = 150; // Characters

// Helper function to determine text color (black or white) based on background hex color
const getTextColorForTag = (hexColor: string | null): string => {
  if (!hexColor) return '#FFFFFF'; // Default to white if no color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};


const StudyResourceCard: React.FC<StudyResourceCardProps> = ({ resource, isExpanded, onToggleExpansion }) => {
  const descriptionIsLong = resource.description.length > MAX_DESC_LENGTH;
  const displayDescription = isExpanded || !descriptionIsLong 
    ? resource.description 
    : `${resource.description.substring(0, MAX_DESC_LENGTH)}...`;

  const handleLinkButtonClick = () => {
    if (resource.downloadLink) {
      window.open(resource.downloadLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-[var(--infoBoxBackground)] p-5 rounded-xl shadow-lg flex flex-col h-full">
      {/* Tags Display */}
      <div className="mb-2 flex flex-wrap gap-1 justify-center">
        {resource.subjectTag && (
          <span 
            className="px-2 py-0.5 text-xs font-medium rounded-full shadow-sm"
            style={{ backgroundColor: resource.subjectColor || '#6B7280', color: getTextColorForTag(resource.subjectColor) }}
            title={`Subject: ${resource.subjectTag}`}
          >
            S: {resource.subjectTag}
          </span>
        )}
        {resource.courseName && (
          <span 
            className="px-2 py-0.5 text-xs font-medium rounded-full shadow-sm"
            style={{ backgroundColor: resource.courseColor || '#4B5563', color: getTextColorForTag(resource.courseColor) }}
            title={`Course: ${resource.courseName}`}
          >
            C: {resource.courseName}
          </span>
        )}
        {resource.generalTags.map(tag => (
          <span 
            key={tag.id} 
            className="px-2 py-0.5 text-xs font-medium rounded-full shadow-sm bg-gray-500 text-white"
            title={`Tag: ${tag.name}`}
          >
            {tag.name}
          </span>
        ))}
      </div>

      {/* Resource Name (Title) */}
      <h4 className="text-xl font-semibold mb-2 text-center text-[var(--text-accent-splash)] break-words">
        {resource.name}
      </h4>
      
      {/* Description */}
      <div 
        className="text-sm text-[var(--text-secondary)] mb-3 flex-grow overflow-y-auto max-h-28 pr-1 whitespace-pre-wrap break-words cursor-pointer"
        onClick={() => onToggleExpansion(resource.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onToggleExpansion(resource.id);}}
        aria-expanded={isExpanded}
        aria-label={`Description for ${resource.name}. Click to ${isExpanded ? 'collapse' : 'expand'}.`}
      >
        {displayDescription}
        {descriptionIsLong && (
          <span className="text-[var(--text-link)] hover:text-[var(--text-link-hover)] ml-1 font-semibold">
            {isExpanded ? "Read Less" : "Read More"}
          </span>
        )}
      </div>
      
      {/* "Resource Link" Button */}
      <div className="mt-auto text-center">
        <Button
          onClick={handleLinkButtonClick}
          disabled={!resource.downloadLink}
          className="!py-2 !px-4 !text-sm !font-semibold rounded-md w-full sm:w-auto"
        >
          Resource Link
        </Button>
      </div>
    </div>
  );
};

export default StudyResourceCard;