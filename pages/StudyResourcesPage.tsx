
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Button from '../components/Button';
import StudyResourceCard from '../components/StudyResourceCard';
import { DetailedHoursData, StudyResource, SubjectDetails, GeneralTag } from '../types';

interface StudyResourcesPageProps {
  pageTitle: string;
  uploadedHoursData: DetailedHoursData | null;
  isLoading: boolean;
  error: string | null;
}

const PAGE_MAIN_TITLE = "Study Resources";

// Helper function to determine text color (black or white) based on background hex color
const getTextColorForBackground = (hexColor: string | null): string => {
  if (!hexColor) return '#FFFFFF'; // Default to white if no color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#FFFFFF';
};

const StudyResourcesPage: React.FC<StudyResourcesPageProps> = ({ pageTitle, uploadedHoursData, isLoading, error }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSubjectFilters, setActiveSubjectFilters] = useState<Set<string>>(new Set());
  const [activeCourseFilters, setActiveCourseFilters] = useState<Record<string, Set<string>>>({}); // subjectId -> Set<courseName>
  const [activeGeneralTagFilters, setActiveGeneralTagFilters] = useState<Set<string>>(new Set()); // Set<generalTagId>
  
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [showAllSubjectFiltersUI, setShowAllSubjectFiltersUI] = useState<boolean>(false);
  const [showAllGeneralTagFiltersUI, setShowAllGeneralTagFiltersUI] = useState<boolean>(false);
  const [expandedCourseFilterSubjectId, setExpandedCourseFilterSubjectId] = useState<string | null>(null);
  const [isGeneralTagDropdownOpen, setIsGeneralTagDropdownOpen] = useState<boolean>(false);

  const subjectButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const courseDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const generalTagFilterButtonRef = useRef<HTMLButtonElement | null>(null);
  const generalTagDropdownRef = useRef<HTMLDivElement | null>(null);


  const subjectsData = uploadedHoursData?.subjectsData;
  const studyResourcesData = uploadedHoursData?.studyResources;
  const availableGeneralTagsData = uploadedHoursData?.availableGeneralTags;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const toggleDescriptionExpansion = (resourceId: string) => {
    setExpandedDescriptions(prev => ({ ...prev, [resourceId]: !prev[resourceId] }));
  };

  // --- Subject & Course Filter Logic (similar to MemberDetailsPage) ---
  const handleSubjectButtonClick = (subjectId: string) => {
    setExpandedCourseFilterSubjectId(prevId => {
      const newId = prevId === subjectId ? null : subjectId;
      // If opening a new subject's course dropdown, and that subject isn't active yet,
      // activate it and select "All Courses" by default for that subject.
      if (newId && !activeSubjectFilters.has(subjectId)) {
        setActiveSubjectFilters(currActive => new Set(currActive).add(subjectId));
        setActiveCourseFilters(currCourses => ({
          ...currCourses,
          [subjectId]: new Set([`ALL_${subjectId}`])
        }));
      }
      return newId;
    });
    setIsGeneralTagDropdownOpen(false); // Close general tag dropdown if open
  };

  const toggleCourseFilter = (subjectId: string, courseName: string) => {
    setActiveCourseFilters(prevActiveCourses => {
      const newActiveCoursesForSubject = new Set(prevActiveCourses[subjectId] || []);
      let subjectShouldBeActive = true;

      if (courseName === `ALL_${subjectId}`) {
        if (newActiveCoursesForSubject.has(courseName)) { // Deselecting "All"
          newActiveCoursesForSubject.clear();
          subjectShouldBeActive = false; // Deactivate subject if "All" is deselected and no specific courses are chosen
        } else { // Selecting "All"
          newActiveCoursesForSubject.clear();
          newActiveCoursesForSubject.add(courseName);
        }
      } else { // Specific course toggled
        newActiveCoursesForSubject.delete(`ALL_${subjectId}`); // Deselect "All" if a specific is chosen
        if (newActiveCoursesForSubject.has(courseName)) {
          newActiveCoursesForSubject.delete(courseName);
        } else {
          newActiveCoursesForSubject.add(courseName);
        }
        if (newActiveCoursesForSubject.size === 0) subjectShouldBeActive = false; // Deactivate subject if no courses selected
      }
      
      setActiveSubjectFilters(prevActiveSubjects => {
        const newActiveSubjects = new Set(prevActiveSubjects);
        if (subjectShouldBeActive) newActiveSubjects.add(subjectId);
        else newActiveSubjects.delete(subjectId);
        return newActiveSubjects;
      });
      
      if (newActiveCoursesForSubject.size === 0) {
        const updated = {...prevActiveCourses};
        delete updated[subjectId];
        return updated;
      }
      return { ...prevActiveCourses, [subjectId]: newActiveCoursesForSubject };
    });
  };

  // --- General Tag Filter Logic ---
  const toggleGeneralTagFilterDropdown = () => {
    setIsGeneralTagDropdownOpen(prev => !prev);
    setExpandedCourseFilterSubjectId(null); // Close course dropdown if open
  };

  const toggleGeneralTag = (tagId: string) => {
    setActiveGeneralTagFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) newSet.delete(tagId);
      else newSet.add(tagId);
      return newSet;
    });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveSubjectFilters(new Set());
    setActiveCourseFilters({});
    setActiveGeneralTagFilters(new Set());
    setExpandedCourseFilterSubjectId(null);
    setIsGeneralTagDropdownOpen(false);
  };
  
  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let clickedInsideCourseFilter = false;
      if (expandedCourseFilterSubjectId) {
        const subjectButton = subjectButtonRefs.current[expandedCourseFilterSubjectId];
        const courseDropdown = courseDropdownRefs.current[expandedCourseFilterSubjectId];
        if ((subjectButton && subjectButton.contains(event.target as Node)) || (courseDropdown && courseDropdown.contains(event.target as Node))) {
          clickedInsideCourseFilter = true;
        }
      }

      let clickedInsideGeneralTagFilter = false;
      if (isGeneralTagDropdownOpen) {
        if ((generalTagFilterButtonRef.current && generalTagFilterButtonRef.current.contains(event.target as Node)) || (generalTagDropdownRef.current && generalTagDropdownRef.current.contains(event.target as Node))) {
          clickedInsideGeneralTagFilter = true;
        }
      }
      
      // Check if click was on *any* subject button that could open a dropdown
      let clickedOnAnySubjectButtonTrigger = false;
      Object.values(subjectButtonRefs.current).forEach(btnRef => {
          if (btnRef && btnRef.contains(event.target as Node)) {
              clickedOnAnySubjectButtonTrigger = true;
          }
      });

      if (!clickedInsideCourseFilter && !clickedOnAnySubjectButtonTrigger) {
        setExpandedCourseFilterSubjectId(null);
      }
      if (!clickedInsideGeneralTagFilter && !(generalTagFilterButtonRef.current && generalTagFilterButtonRef.current.contains(event.target as Node))) {
        setIsGeneralTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [expandedCourseFilterSubjectId, isGeneralTagDropdownOpen]);


  const filteredResources: StudyResource[] | null | undefined = useMemo(() => {
    if (!studyResourcesData) return null;
    let resources = studyResourcesData;

    // Search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      resources = resources.filter(resource =>
        resource.name.toLowerCase().includes(lowerSearchTerm) ||
        resource.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // General tag filter
    if (activeGeneralTagFilters.size > 0) {
      resources = resources.filter(resource =>
        resource.generalTags.some(tag => activeGeneralTagFilters.has(tag.id))
      );
    }
    
    // Combined Subject and Course Filter
    const anySubjectOrCourseFilterActive = activeSubjectFilters.size > 0;
    if (anySubjectOrCourseFilterActive) {
      resources = resources.filter(resource => {
        // A resource is a match if it satisfies AT LEAST ONE of the active subject filters.
        return Array.from(activeSubjectFilters).some(subjectId => {
          // Rule 1: Resource must have the subject.
          const hasSubject = resource.matchedSubjects.some(s => s.id === subjectId);
          if (!hasSubject) return false;
    
          // Rule 2: Check course constraints for this subject.
          const courseFilterForSubject = activeCourseFilters[subjectId];
          if (!courseFilterForSubject || courseFilterForSubject.size === 0 || courseFilterForSubject.has(`ALL_${subjectId}`)) {
            // No course constraint or "All" selected, so subject match is enough.
            return true;
          }
    
          // Rule 3: Check for specific course match.
          return resource.matchedCourses.some(course =>
            course.subjectId === subjectId && courseFilterForSubject.has(course.name)
          );
        });
      });
    }

    return resources;
  }, [studyResourcesData, searchTerm, activeSubjectFilters, activeCourseFilters, activeGeneralTagFilters]);

  const displayedSubjectFilters = showAllSubjectFiltersUI ? subjectsData : subjectsData?.slice(0, 5);
  const displayedGeneralTagFilters = showAllGeneralTagFiltersUI ? availableGeneralTagsData : availableGeneralTagsData?.slice(0, 5);
  
  const anyFilterActive = searchTerm || activeSubjectFilters.size > 0 || Object.keys(activeCourseFilters).some(key => activeCourseFilters[key]?.size > 0) || activeGeneralTagFilters.size > 0;

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-10 bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="mb-8 text-center w-full max-w-screen-xl">
        <div className="flex justify-start mb-4">
          <Button to="/" className="!py-2 !px-4 !text-base sm:!text-lg !font-semibold rounded-lg">
            &larr; Back to Home
          </Button>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)]">{PAGE_MAIN_TITLE}</h1>
        {pageTitle !== PAGE_MAIN_TITLE && <p className="text-xl text-[var(--text-secondary)] mt-2">{pageTitle}</p>}
      </header>

      <main className="flex-grow w-full max-w-screen-2xl">
        <div className="mb-6 w-full max-w-xl mx-auto">
          <input
            type="search"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-[var(--adminModalInputBackground)] border border-[var(--adminModalInputBorder)] rounded-lg text-[var(--text-primary)] text-lg sm:text-xl focus:ring-2 focus:ring-[var(--adminModalFocusRing)] focus:border-[var(--adminModalFocusRing)] outline-none transition-colors"
            aria-label="Search study resources"
          />
        </div>

        {/* Filter Section */}
        {(subjectsData || availableGeneralTagsData) && (
          <div className="mb-8 p-4 bg-[var(--infoBoxBackground)] rounded-lg shadow-md w-full max-w-screen-lg mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Filters:</h3>
              {anyFilterActive && (
                <button 
                  onClick={clearAllFilters} 
                  className="px-3 py-1.5 text-xs font-medium rounded-md shadow-sm bg-[var(--button-primary-background)] text-[var(--buttonText)] hover:bg-[var(--button-primary-background-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--button-ring)]"
                >
                  Clear All Filters
                </button>
              )}
            </div>
            
            {/* Subject and Course Filters */}
            {subjectsData && subjectsData.length > 0 && (
              <div className="flex flex-wrap gap-2 items-start mb-3 pb-3 border-b border-[var(--tableBorderColor)]">
                {displayedSubjectFilters?.map(subject => (
                  <div key={subject.id} className="relative">
                    <button
                      ref={(el) => { subjectButtonRefs.current[subject.id] = el; }}
                      onClick={() => handleSubjectButtonClick(subject.id)}
                      style={{ 
                        backgroundColor: activeSubjectFilters.has(subject.id) ? subject.color : 'var(--button-primary-background)', 
                        color: getTextColorForBackground(activeSubjectFilters.has(subject.id) ? subject.color : null),
                        borderColor: activeSubjectFilters.has(subject.id) ? getTextColorForBackground(subject.color) : 'transparent',
                      }}
                      className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md shadow-sm border-2 transition-all hover:bg-opacity-80 ${activeSubjectFilters.has(subject.id) ? 'ring-2 ring-offset-2 ring-offset-[var(--infoBoxBackground)] ring-[var(--adminModalFocusRing)]' : 'hover:bg-[var(--button-primary-background-hover)]'}`}
                      aria-pressed={activeSubjectFilters.has(subject.id)}
                      aria-expanded={expandedCourseFilterSubjectId === subject.id}
                      aria-controls={`courses-filter-${subject.id}`}
                    >
                      {subject.name}
                      <span className="ml-1.5 text-xs transform transition-transform duration-200">
                        {expandedCourseFilterSubjectId === subject.id ? '▲' : '▼'}
                      </span>
                    </button>
                    {expandedCourseFilterSubjectId === subject.id && subject.courses.length > 0 && (
                      <div 
                        ref={(el) => { courseDropdownRefs.current[subject.id] = el; }}
                        id={`courses-filter-${subject.id}`}
                        className="absolute top-full left-0 mt-1 p-3 bg-[var(--contentPageBoxBackground)] border border-[var(--adminModalInputBorder)] rounded-md shadow-lg z-20 w-[90vw] max-w-md sm:min-w-[360px] max-h-72 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-2"
                      >
                        <button
                          onClick={() => toggleCourseFilter(subject.id, `ALL_${subject.id}`)}
                          style={{
                              backgroundColor: activeCourseFilters[subject.id]?.has(`ALL_${subject.id}`) ? subject.color : 'var(--button-secondary-background)',
                              color: getTextColorForBackground(activeCourseFilters[subject.id]?.has(`ALL_${subject.id}`) ? subject.color : null),
                              borderColor: subject.color
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm font-medium rounded border mb-1.5 hover:opacity-80 transition-colors ${activeCourseFilters[subject.id]?.has(`ALL_${subject.id}`) ? 'ring-1 ring-offset-1 ring-offset-[var(--contentPageBoxBackground)] ring-white' : '' }`}
                          aria-pressed={activeCourseFilters[subject.id]?.has(`ALL_${subject.id}`)}
                        >
                          All {subject.name} Courses
                        </button>
                        {subject.courses.map(course => (
                          <button
                            key={course.name}
                            onClick={() => toggleCourseFilter(subject.id, course.name)}
                            style={{
                              backgroundColor: activeCourseFilters[subject.id]?.has(course.name) ? course.color : 'var(--button-secondary-background)',
                              color: getTextColorForBackground(activeCourseFilters[subject.id]?.has(course.name) ? course.color : null),
                              borderColor: course.color,
                            }}
                            className={`block w-full text-left px-3 py-2 text-sm font-medium rounded border mb-1.5 hover:opacity-80 transition-colors ${activeCourseFilters[subject.id]?.has(course.name) ? 'ring-1 ring-offset-1 ring-offset-[var(--contentPageBoxBackground)] ring-white' : '' }`}
                            aria-pressed={activeCourseFilters[subject.id]?.has(course.name)}
                          >
                            {course.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {subjectsData.length > 5 && (
                  <button 
                    onClick={() => setShowAllSubjectFiltersUI(!showAllSubjectFiltersUI)}
                    className="px-3 py-1.5 text-sm font-medium rounded-md shadow-sm bg-[var(--button-primary-background)] text-[var(--buttonText)] hover:bg-[var(--button-primary-background-hover)]"
                  >
                    {showAllSubjectFiltersUI ? 'Less Subjects' : 'More Subjects...'}
                  </button>
                )}
              </div>
            )}

            {/* General Tag Filters */}
            {availableGeneralTagsData && availableGeneralTagsData.length > 0 && (
              <div className="flex flex-wrap gap-2 items-start relative">
                <button
                  ref={generalTagFilterButtonRef}
                  onClick={toggleGeneralTagFilterDropdown}
                  className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md shadow-sm border-2 transition-all hover:bg-opacity-80 ${activeGeneralTagFilters.size > 0 ? 'bg-[var(--text-accent-info)] text-white border-white ring-2 ring-offset-2 ring-offset-[var(--infoBoxBackground)] ring-[var(--adminModalFocusRing)]' : 'bg-[var(--button-primary-background)] text-[var(--buttonText)] border-transparent hover:bg-[var(--button-primary-background-hover)]'}`}
                  aria-haspopup="true"
                  aria-expanded={isGeneralTagDropdownOpen}
                >
                  Filter by General Tag ({activeGeneralTagFilters.size})
                  <span className="ml-1.5 text-xs transform transition-transform duration-200">
                    {isGeneralTagDropdownOpen ? '▲' : '▼'}
                  </span>
                </button>
                {isGeneralTagDropdownOpen && (
                  <div 
                    ref={generalTagDropdownRef}
                    className="absolute top-full left-0 mt-1 p-3 bg-[var(--contentPageBoxBackground)] border border-[var(--adminModalInputBorder)] rounded-md shadow-lg z-20 w-[90vw] max-w-md sm:min-w-[360px] max-h-72 overflow-y-auto"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2">
                      {(showAllGeneralTagFiltersUI ? availableGeneralTagsData : availableGeneralTagsData.slice(0,10)).map(tag => (
                         <label key={tag.id} className="flex items-center px-3 py-2 text-sm font-medium rounded hover:bg-[var(--adminModalInputBackground)] cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={activeGeneralTagFilters.has(tag.id)}
                              onChange={() => toggleGeneralTag(tag.id)}
                              className="mr-2 h-4 w-4 text-[var(--text-accent-info)] bg-[var(--adminModalInputBackground)] border-[var(--adminModalInputBorder)] rounded focus:ring-[var(--adminModalFocusRing)]"
                            />
                            {tag.name}
                         </label>
                      ))}
                    </div>
                    {availableGeneralTagsData.length > 10 && (
                       <button
                         onClick={() => setShowAllGeneralTagFiltersUI(!showAllGeneralTagFiltersUI)}
                         className="w-full mt-2 px-3 py-1 text-xs text-[var(--text-link)] hover:underline"
                       >
                         {showAllGeneralTagFiltersUI ? 'Show Fewer Tags' : 'Show More Tags...'}
                       </button>
                    )}
                  </div>
                )}
                 {Array.from(activeGeneralTagFilters).map(tagId => {
                    const tag = availableGeneralTagsData.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                        <span key={tagId} className="px-2 py-0.5 text-xs font-medium rounded-full shadow-sm bg-gray-500 text-white">
                            {tag.name}
                        </span>
                    );
                 })}
              </div>
            )}
          </div>
        )}


        {/* Resource Display Area */}
        {isLoading && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-secondary)]">Loading study resources...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-error)] mb-4">Error loading data:</p>
            <p className="text-lg text-[var(--text-secondary)]">{error}</p>
          </div>
        )}
        {!isLoading && !error && filteredResources && filteredResources.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredResources.map(resource => (
              <StudyResourceCard 
                key={resource.id} 
                resource={resource}
                isExpanded={!!expandedDescriptions[resource.id]}
                onToggleExpansion={toggleDescriptionExpansion}
              />
            ))}
          </div>
        )}
        {!isLoading && !error && (!filteredResources || filteredResources.length === 0) && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl mt-8">
            <p className="text-xl text-[var(--text-secondary)]">
              {anyFilterActive
                ? "No study resources match your current search/filters." 
                : 'No study resources found. Please check the "StudyResources" sheet in NHSExcel.xlsx.'}
            </p>
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

export default StudyResourcesPage;