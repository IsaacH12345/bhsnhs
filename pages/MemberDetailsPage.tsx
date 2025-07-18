
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Button from '../components/Button';
import MemberCard from '../components/MemberCard';
import { DetailedHoursData, MemberProficiencyInfo, SubjectDetails } from '../types';

interface MemberDetailsPageProps {
  pageTitle: string;
  uploadedHoursData: DetailedHoursData | null;
  isLoading: boolean;
  error: string | null;
}

const PAGE_MAIN_TITLE = "BHS NHS Member Details";
const CUSTOM_SUB_HEADER = "Email Isaac Hilderbrand to get your tutoring proficiencies lists.";

const MemberDetailsPage: React.FC<MemberDetailsPageProps> = ({ pageTitle, uploadedHoursData, isLoading, error }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSubjectFilters, setActiveSubjectFilters] = useState<Set<string>>(new Set());
  const [activeCourseFilters, setActiveCourseFilters] = useState<Record<string, Set<string>>>({});
  const [showAllSubjectFilters, setShowAllSubjectFilters] = useState<boolean>(false);
  const [expandedCourseFilterSubjectId, setExpandedCourseFilterSubjectId] = useState<string | null>(null);

  const filterSectionRef = useRef<HTMLDivElement>(null);
  const subjectButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const courseDropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});


  const subjectsData = uploadedHoursData?.subjectsData;
  const memberProficienciesData = uploadedHoursData?.memberProficiencies;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSubjectButtonClick = (subjectId: string) => {
    setExpandedCourseFilterSubjectId(prev => {
      const newExpandedId = prev === subjectId ? null : subjectId;
      if (newExpandedId && !activeSubjectFilters.has(subjectId)) {
        setActiveSubjectFilters(currActive => new Set(currActive).add(subjectId));
        setActiveCourseFilters(currCourses => ({
          ...currCourses,
          [subjectId]: new Set([`ALL_${subjectId}`]) // Default to "All" when first activating via dropdown
        }));
      }
      return newExpandedId;
    });
  };

  const toggleCourseFilter = (subjectId: string, courseName: string) => {
    setActiveCourseFilters(prevActiveCourses => {
      const newActiveCoursesForSubject = new Set(prevActiveCourses[subjectId] || []);
      let subjectShouldBeActive = false;

      if (courseName === `ALL_${subjectId}`) {
        if (newActiveCoursesForSubject.has(courseName)) { // Deselecting "All"
          newActiveCoursesForSubject.clear();
          subjectShouldBeActive = false;
        } else { // Selecting "All"
          newActiveCoursesForSubject.clear();
          newActiveCoursesForSubject.add(courseName);
          subjectShouldBeActive = true;
        }
      } else { // Specific course toggled
        if (newActiveCoursesForSubject.has(courseName)) { // Deselecting specific course
          newActiveCoursesForSubject.delete(courseName);
          if (newActiveCoursesForSubject.size > 0) { // Other specific courses still selected
            subjectShouldBeActive = true;
          } else {
            // No specific courses left, and "All" isn't selected
            subjectShouldBeActive = false;
          }
        } else { // Selecting specific course
          newActiveCoursesForSubject.add(courseName);
          newActiveCoursesForSubject.delete(`ALL_${subjectId}`); // Deselect "All" if a specific is chosen
          subjectShouldBeActive = true;
        }
      }

      setActiveSubjectFilters(prevActiveSubjects => {
        const newActiveSubjects = new Set(prevActiveSubjects);
        if (subjectShouldBeActive) {
          newActiveSubjects.add(subjectId);
        } else {
          newActiveSubjects.delete(subjectId);
        }
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
  
  const clearAllFilters = () => {
    setActiveSubjectFilters(new Set());
    setActiveCourseFilters({});
    setExpandedCourseFilterSubjectId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!expandedCourseFilterSubjectId) return;

      const subjectButton = subjectButtonRefs.current[expandedCourseFilterSubjectId];
      const courseDropdown = courseDropdownRefs.current[expandedCourseFilterSubjectId];

      let clickedOnSubjectButtonForDropdown = false;
      if (subjectButton && subjectButton.contains(event.target as Node)) {
        clickedOnSubjectButtonForDropdown = true;
      }

      let clickedInsideDropdown = false;
      if (courseDropdown && courseDropdown.contains(event.target as Node)) {
        clickedInsideDropdown = true;
      }
      
      // Check if click was on *any* subject button
      let clickedOnAnySubjectButton = false;
        Object.values(subjectButtonRefs.current).forEach(btnRef => {
            if (btnRef && btnRef.contains(event.target as Node)) {
                clickedOnAnySubjectButton = true;
            }
        });


      if (!clickedInsideDropdown && !clickedOnAnySubjectButton) {
        setExpandedCourseFilterSubjectId(null);
      }
    };

    if (expandedCourseFilterSubjectId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedCourseFilterSubjectId]);


  const filteredMembers: MemberProficiencyInfo[] | null | undefined = useMemo(() => {
    if (!memberProficienciesData) return null;
    let members = memberProficienciesData;

    if (searchTerm) {
      members = members.filter(member =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const activeSubjectsArray = Array.from(activeSubjectFilters);
    if (activeSubjectsArray.length > 0) {
      members = members.filter(member => {
        return activeSubjectsArray.some(subjectId => {
          const subjectProficiency = member.proficienciesBySubject.find(p => p.subjectId === subjectId);
          if (!subjectProficiency) return false;

          const coursesForThisSubjectFilter = activeCourseFilters[subjectId];
          if (!coursesForThisSubjectFilter || coursesForThisSubjectFilter.size === 0 || coursesForThisSubjectFilter.has(`ALL_${subjectId}`)) {
            return true;
          }
          
          return subjectProficiency.proficientCoursesInSubject.some(course => 
            coursesForThisSubjectFilter.has(course.name)
          );
        });
      });
    }
    return members;
  }, [memberProficienciesData, searchTerm, activeSubjectFilters, activeCourseFilters]);

  const getTextColorForBackground = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#FFFFFF';
  };

  const displayedSubjects = showAllSubjectFilters ? subjectsData : subjectsData?.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-6 md:p-10 bg-[var(--background-primary)] text-[var(--text-primary)]">
      <header className="mb-8 text-center w-full max-w-screen-xl">
        <div className="flex justify-start mb-4">
          <Button to="/" className="!py-2 !px-4 !text-base sm:!text-lg !font-semibold rounded-lg">
            &larr; Back to Home
          </Button>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)]">{PAGE_MAIN_TITLE}</h1>
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] mt-2">{CUSTOM_SUB_HEADER}</p>
      </header>

      <main className="flex-grow w-full max-w-screen-2xl">
        <div className="mb-6 w-full max-w-lg mx-auto">
          <input
            type="search"
            placeholder="Search for a member..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 sm:px-5 sm:py-4 bg-[var(--adminModalInputBackground)] border border-[var(--adminModalInputBorder)] rounded-lg text-[var(--text-primary)] text-lg sm:text-xl focus:ring-2 focus:ring-[var(--adminModalFocusRing)] focus:border-[var(--adminModalFocusRing)] outline-none transition-colors"
            aria-label="Search for a member by name"
          />
        </div>

        {subjectsData && subjectsData.length > 0 && (
          <div ref={filterSectionRef} className="mb-8 p-4 bg-[var(--infoBoxBackground)] rounded-lg shadow-md w-full max-w-screen-lg mx-auto">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold">Filter by Subject & Course:</h3>
                {(activeSubjectFilters.size > 0 || Object.keys(activeCourseFilters).some(key => activeCourseFilters[key]?.size > 0)) && (
                <button 
                    onClick={clearAllFilters} 
                    className="px-3 py-1.5 text-xs font-medium rounded-md shadow-sm bg-[var(--button-primary-background)] text-[var(--buttonText)] hover:bg-[var(--button-primary-background-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--button-ring)]"
                  >
                    Clear All Filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-start">
              {displayedSubjects?.map(subject => (
                <div key={subject.id} className="relative">
                  <button
                    ref={(el) => { subjectButtonRefs.current[subject.id] = el; }}
                    onClick={() => handleSubjectButtonClick(subject.id)}
                    style={{ 
                      backgroundColor: activeSubjectFilters.has(subject.id) ? subject.color : 'var(--button-primary-background)', 
                      color: activeSubjectFilters.has(subject.id) ? getTextColorForBackground(subject.color) : 'var(--buttonText)',
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
                            color: activeCourseFilters[subject.id]?.has(`ALL_${subject.id}`) ? getTextColorForBackground(subject.color) : 'var(--text-primary)',
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
                            color: activeCourseFilters[subject.id]?.has(course.name) ? getTextColorForBackground(course.color) : 'var(--text-primary)',
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
              {subjectsData.length > 4 && (
                <button 
                  onClick={() => setShowAllSubjectFilters(!showAllSubjectFilters)}
                  className="px-3 py-1.5 text-sm font-medium rounded-md shadow-sm bg-[var(--button-primary-background)] text-[var(--buttonText)] hover:bg-[var(--button-primary-background-hover)]"
                  aria-label={showAllSubjectFilters ? "Show fewer subjects" : "Show more subjects"}
                >
                  {showAllSubjectFilters ? 'Less' : 'More...'}
                </button>
              )}
            </div>
            
            {(activeSubjectFilters.size > 0 || Object.keys(activeCourseFilters).some(key => activeCourseFilters[key]?.size > 0)) && (
              <div className="mt-3 pt-2 border-t border-[var(--tableBorderColor)] flex items-center gap-2 flex-wrap">
                 <p className="text-xs text-[var(--text-tertiary)]">Active filters:</p>
                 {Array.from(activeSubjectFilters).map(subjectId => {
                   const subject = subjectsData.find(s => s.id === subjectId);
                   if (!subject) return null;
                   const coursesFiltered = activeCourseFilters[subjectId];
                   let filterText = subject.name;
                   if (coursesFiltered && coursesFiltered.size > 0 && !coursesFiltered.has(`ALL_${subjectId}`)) {
                     filterText = `${subject.name} (${Array.from(coursesFiltered).slice(0,2).join(', ')}${coursesFiltered.size > 2 ? '...' : ''})`;
                   } else if (coursesFiltered && coursesFiltered.has(`ALL_${subjectId}`)){
                     filterText = `${subject.name} (All)`;
                   }
                   return (
                    <span 
                      key={subjectId} 
                      className="px-2.5 py-1 text-xs font-medium rounded-full shadow-sm"
                      style={{backgroundColor: subject.color, color: getTextColorForBackground(subject.color) }}
                      title = {`Filtering by: ${subject.name}${coursesFiltered && coursesFiltered.size > 0 && !coursesFiltered.has(`ALL_${subjectId}`) ? ` (${Array.from(coursesFiltered).join(', ')})` : coursesFiltered && coursesFiltered.has(`ALL_${subjectId}`) ? ' (All Courses)' : ' (Any Course)'}`}
                    >
                      {filterText}
                    </span>
                   );
                 })}
              </div>
            )}
          </div>
        )}


        {isLoading && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-secondary)]">Loading member proficiency data...</p>
          </div>
        )}
        {!isLoading && error && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl">
            <p className="text-xl text-[var(--text-error)] mb-4">Error loading data:</p>
            <p className="text-lg text-[var(--text-secondary)]">{error}</p>
          </div>
        )}
        {!isLoading && !error && filteredMembers && filteredMembers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMembers.map(member => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
        {!isLoading && !error && (!filteredMembers || filteredMembers.length === 0) && (
          <div className="text-center bg-[var(--infoBoxBackground)] p-10 rounded-xl shadow-2xl mt-8">
            <p className="text-xl text-[var(--text-secondary)]">
              {searchTerm || activeSubjectFilters.size > 0 || Object.keys(activeCourseFilters).some(key => activeCourseFilters[key]?.size > 0) 
                ? "No members match your current search/filter." 
                : 'No member proficiency details found. Please check the "MemberDetails" and "Subjects" sheets in NHSExcel.xlsx.'}
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

export default MemberDetailsPage;
