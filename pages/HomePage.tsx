
import React, { useState, useEffect, useMemo } from 'react';
import Button from '../components/Button';
import InfoBox from '../components/InfoBox';
import EventModal from '../components/EventModal'; // New component
import ChangelogModal from '../components/ChangelogModal'; // Added for changelog
import useSplashText from '../hooks/useSplashText';
import { NAVIGATION_LINKS } from '../constants';
import { DynamicListItem, PageConfig, DetailedHoursData, MemberDetailedHours } from '../types';

interface HomePageProps {
  uploadedHoursData: DetailedHoursData | null;
}

// Instructions for the user (updated):
// 1. 'assets' folder: creature_base64.txt, giraffe_base64.txt, [id]_icon_base64.txt for buttons.
// 2. "NHSExcel.xlsx" in root directory with sheets in this specific order:
//    Sheet 1: "HourTracker" (Defines daily tutoring hours)
//       - Excel Row 2 (Data Array Index 1): Dates for tutoring sessions (starting Col B, every other col for AM/PM slots).
//       - Excel Row 3 (Data Array Index 2): "AM" or "PM" designators for the date columns above.
//       - Excel Row 5 (Data Array Index 4) onwards, Col A: Member Names.
//       - Excel Row 5 (Data Array Index 4) onwards, Col B onwards: Hours tutored for corresponding date/session.
//
//    Sheet 2: "AdditionalHours" (Tracks non-daily tutoring hours)
//       - Data STARTS from Excel Row 3 (Data Array Index 2). Row 1-2 can be headers but are ignored.
//       - Col A: Member Name (Must match names in "HourTracker").
//       - Col B: Date of Additional Hours (e.g., MM/DD/YYYY).
//       - Col C: Number of Additional Hours.
//       - Col D: Notes/Description for the additional hours.
//
//    Sheet 3: "Information" (General website content and metadata)
//       - Cell B1 (Data Array Index 0, Col Index 1): Website Last Updated Date (e.g., MM/DD/YYYY).
//       - Cell B2 (Data Array Index 1, Col Index 1): Hours Updated Date (e.g., MM/DD/YYYY).
//       - Cell B3 (Data Array Index 2, Col Index 1): Semester 1 Start Date (e.g., MM/DD/YYYY).
//       - Cell B4 (Data Array Index 3, Col Index 1): Semester 2 Start Date (e.g., MM/DD/YYYY).
//       - Cell B5 (Data Array Index 4, Col Index 1): Semester 2 End Date (e.g., MM/DD/YYYY). (NEW)
//       - Excel Row 8 (Data Array Index 7) onwards:
//         - Cols A,B,C: Upcoming Event Date, Event Name, Event Description.
//         - Cols E,F: Link Display Text, Link URL.
//         - Cols H,I,J: Info/Update Date, Update Header, Update Content.
//         - Cols L,M: Changelog Date, Changelog Description.
//         - Cols O,P: Suggestions Text (O8), Suggestions Button URL (P8).
//       - Col R (Excel Row 2 onwards, Data Array Index 1 onwards): Splash Texts for homepage. (NEW)
//
//    Sheet 4: "Officers" (Details for NHS Officers)
//       - Data STARTS from Excel Row 3 (Data Array Index 2).
//       - Col A: Officer Name.
//       - Col B: Role.
//       - Col C: Email.
//       - Col D: Description.
//       - Col E onwards (concatenated): Primary Base64 Image string for the officer.
//       - For Secondary Images (Optional):
//         - Data STARTS from Excel Row 26 (Data Array Index 25), corresponding to the first officer in Row 3.
//         - Col E onwards (concatenated): Secondary Base64 Image string for the officer.
//
//    Sheet 5: "MemberDetails" (Tracks member proficiencies in specific COURSES)
//       - Excel Row 6 (Data Array Index 5) onwards, Col A: Member Names (Must match names in "HourTracker").
//       - Excel Row 6 (Data Array Index 5) onwards, Col B, C, D... (for each member):
//         List the EXACT Course Names the member is proficient in, each in its own cell.
//         These course names MUST match (case-insensitively) the course names defined in the "Subjects" sheet (Sheet 6)
//         for their respective subjects.
//
//    Sheet 6: "Subjects" (Defines subjects and their associated courses, including colors)
//       - Data STARTS from Excel Row 2 (Data Array Index 1). Row 1 can be headers but is ignored.
//       - Col Q (Index 16): Subject Name (e.g., "Math", "Science").
//       - Col R (Index 17): Cell reference for the FIRST course name belonging to this subject
//                            (e.g., if "Math" courses start at cell A20, enter "A20").
//       - Col S (Index 18): Cell reference for the LAST course name belonging to this subject
//                            (e.g., if "Math" courses end at cell A25, enter "A25").
//                            The course names themselves must be listed in a SINGLE column within THIS "Subjects" sheet.
//       - Col T (Index 19): Hex Color Code for the Subject itself (e.g., "#007BFF").
//       - Course Names & Their Colors (within THIS "Subjects" sheet):
//         - In the column specified by the cell references in Col R & S (e.g., Column A, from row 20 to 25),
//           list the EXACT Course Names (e.g., "Geometry Honors", "AP Chemistry").
//         - In the column IMMEDIATELY TO THE RIGHT of where course names are listed (e.g., Column B if course names are in A),
//           list the corresponding Hex Color Code for EACH course (e.g., "#FFC107").


const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const mainNavLinks = NAVIGATION_LINKS.slice(1, 7);
const NAV_BUTTON_IDS = mainNavLinks.map(link => link.id);


// Helper to parse MM/DD/YYYY string to Date object
const parseDateMMDDYYYY = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (!isNaN(month) && !isNaN(day) && !isNaN(year) && year > 1000 && year < 3000 && month >= 0 && month <= 11 && day >=1 && day <= 31) {
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
  }
  return null;
};

// Helper to determine current semester
const getCurrentSemester = (now: Date, sem1Start: Date | null, sem2Start: Date | null, sem2End?: Date | null): { current: 1 | 2 | null, name: string } => {
  // Note: sem2End is not used by this specific function currently but passed for potential future use or consistency.
  // This function primarily determines if we are IN S1 or S2 based on start dates.
  if (sem2Start && now >= sem2Start) {
    // If sem2End exists and now is past sem2End, it's technically "After Semester 2"
    if (sem2End && now >= sem2End) {
      return { current: null, name: "After Semester 2" };
    }
    return { current: 2, name: "Semester 2" };
  }
  if (sem1Start && now >= sem1Start) {
    return { current: 1, name: "Semester 1" };
  }
  if (sem1Start && now < sem1Start) {
    return { current: null, name: "Before Semester 1" };
  }
  return { current: null, name: "N/A (Dates not set)" };
};


const HomePage: React.FC<HomePageProps> = ({ uploadedHoursData }) => {
  const splashText = useSplashText(uploadedHoursData);

  const [creatureSrc, setCreatureSrc] = useState<string>(TRANSPARENT_PIXEL);
  const [giraffeSrc, setGiraffeSrc] = useState<string>(TRANSPARENT_PIXEL);
  const [buttonIconSources, setButtonIconSources] = useState<Record<string, string>>({});
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(true);
  const [assetError, setAssetError] = useState<string | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<DynamicListItem | null>(null);
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState<number>(0);
  const [isChangelogModalOpen, setIsChangelogModalOpen] = useState<boolean>(false);

  const displayWebsiteLastUpdated = uploadedHoursData?.websiteLastUpdatedDateTime || 'N/A';
  const displayHoursLastUpdated = uploadedHoursData?.hoursLastUpdatedDateTime || 'N/A';
  
  const upcomingEvents = uploadedHoursData?.upcomingEvents || [];
  const links = uploadedHoursData?.links || [];
  const infoUpdates = uploadedHoursData?.infoUpdates || [];
  const changelogUpdates = uploadedHoursData?.changelogUpdates || [];


  const hourStatistics = useMemo(() => {
    if (!uploadedHoursData || !uploadedHoursData.members) {
      return {
        totalHoursSum: 'N/A',
        totalVolunteerSessions: 'N/A',
        totalNhsMembers: 'N/A',
        activeTutorsThisSemester: 'N/A',
        membersWithAtLeast1Hour: 'N/A',
        membersWithAtLeast5Hours: 'N/A',
        membersWithAtLeast10Hours: 'N/A',
        topTutorDisplay: 'N/A',
        daysLeftFor5RequiredHours: 'N/A',
      };
    }

    const members = uploadedHoursData.members;
    const nowForSemesterCheck = new Date(); // Used for current semester determination
    
    // Dates from spreadsheet are already Date objects or null
    const s1StartDate = uploadedHoursData.sem1StartDate;
    const s2StartDate = uploadedHoursData.sem2StartDate;
    const s2EndDate = uploadedHoursData.sem2EndDate; 

    // 1. Total Hours Logged
    const totalHoursSum = members.reduce((sum, member) => sum + member.totalHours, 0);

    // 2. Total Volunteer Sessions
    const totalVolunteerSessions = members.reduce((sum, member) => 
      sum + member.dailyDetails.length + member.additionalHourDetails.length, 0);

    // 3. Total NHS Members
    const totalNhsMembers = members.length;

    // 4. Active Tutors This Semester
    const { current: currentSemesterValue, name: currentSemesterName } = getCurrentSemester(nowForSemesterCheck, s1StartDate, s2StartDate, s2EndDate);
    let activeTutorsCount = 0;
    if (currentSemesterValue && members.length > 0) {
      const activeMemberNames = new Set<string>();
      members.forEach(member => {
        const hasHoursInCurrentSemester = 
          member.dailyDetails.some(d => d.semester === currentSemesterValue) ||
          member.additionalHourDetails.some(a => a.semester === currentSemesterValue);
        if (hasHoursInCurrentSemester) {
          activeMemberNames.add(member.memberName);
        }
      });
      activeTutorsCount = activeMemberNames.size;
    }
    const activeTutorsDisplay = `${activeTutorsCount}${currentSemesterName !== "N/A (Dates not set)" && currentSemesterName !== "Before Semester 1" && currentSemesterName !== "After Semester 2" ? ` (${currentSemesterName})` : ''}`;

    // 5. Members with at least 1 Hour
    const membersWithAtLeast1Hour = members.filter(member => member.totalHours >= 1).length;

    // 6. Members with at least 5 Hours
    const membersWithAtLeast5Hours = members.filter(member => member.totalHours >= 5).length;

    // 7. Members with at least 10 Hours
    const membersWithAtLeast10Hours = members.filter(member => member.totalHours >= 10).length;

    // 8. Top Tutor (Most Hours)
    let topTutorName = 'N/A';
    let topTutorHours = '';
    if (members.length > 0) {
      const topTutor = members.reduce((max, member) => (member.totalHours > max.totalHours ? member : max), members[0]);
      if (topTutor.totalHours > 0) {
        topTutorName = topTutor.memberName;
        topTutorHours = topTutor.totalHours.toFixed(1);
      }
    }
    const topTutorDisplay = topTutorHours ? `${topTutorName} (${topTutorHours} hrs)` : 'N/A';
    
    // 9. Days Left to Finish 5 Required Hours (Statistic 12 in original list, now 9)
    let daysLeftValue = 'N/A';
    const todayForDeadline = new Date();
    todayForDeadline.setHours(0, 0, 0, 0); // Normalize today for comparison

    // Normalize semester dates from props as well, if they exist
    const s1StartNorm = s1StartDate ? new Date(s1StartDate.getTime()) : null;
    if (s1StartNorm) s1StartNorm.setHours(0,0,0,0);
    const s2StartNorm = s2StartDate ? new Date(s2StartDate.getTime()) : null;
    if (s2StartNorm) s2StartNorm.setHours(0,0,0,0);
    const s2EndNorm = s2EndDate ? new Date(s2EndDate.getTime()) : null;
    if (s2EndNorm) s2EndNorm.setHours(0,0,0,0);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    if (s1StartNorm && todayForDeadline < s1StartNorm) {
      daysLeftValue = 'N/A (Before S1)';
    } else if (s1StartNorm && (!s2StartNorm || todayForDeadline < s2StartNorm)) { // In Semester 1 (or S1 is the active period before S2 starts)
      let deadline: Date | null = null;
      let deadlineReason = "";
      let deadlinePassedMsg = "Deadline for Sem 1 passed";

      if (s2StartNorm) { 
        deadline = s2StartNorm;
        deadlineReason = "S2 starts";
      } else if (s2EndNorm) { // No S2 start, S1 runs until S2 end (if S2End is the only other marker)
        deadline = s2EndNorm;
        deadlineReason = "end of S1 period";
      }

      if (deadline) {
        const diffTime = deadline.getTime() - todayForDeadline.getTime();
        if (diffTime < 0) { 
          daysLeftValue = deadlinePassedMsg;
        } else { 
          const daysLeft = Math.ceil(diffTime / MS_PER_DAY);
          daysLeftValue = `${daysLeft} day(s) (until ${deadlineReason})`;
        }
      } else {
        daysLeftValue = 'N/A (S1 deadline unclear)';
      }
    } else if (s2StartNorm && (!s2EndNorm || todayForDeadline < s2EndNorm)) { // In Semester 2
      if (s2EndNorm) { 
        const diffTime = s2EndNorm.getTime() - todayForDeadline.getTime();
        if (diffTime < 0) { 
          daysLeftValue = 'Semester 2 Ended';
        } else { 
          const daysLeft = Math.ceil(diffTime / MS_PER_DAY);
          daysLeftValue = `${daysLeft} day(s) (until S2 ends)`;
        }
      } else {
        daysLeftValue = 'N/A (S2 end date not set)';
      }
    } else if (s2EndNorm && todayForDeadline >= s2EndNorm) { // After Semester 2 has ended
      daysLeftValue = 'Semester 2 Ended';
    } else if (!s1StartNorm && !s2StartNorm && !s2EndNorm) {
        daysLeftValue = 'N/A (Semester dates not set)';
    } else { 
        // Catch specific case: In Sem 2 (S2Start is past), but no S2End defined
        if (s2StartNorm && todayForDeadline >= s2StartNorm && !s2EndNorm) {
            daysLeftValue = 'N/A (S2 end date not set)';
        } else {
            daysLeftValue = 'N/A (Deadline status unclear)';
        }
    }

    return {
      totalHoursSum: members.length > 0 ? totalHoursSum.toFixed(1) : '0.0',
      totalVolunteerSessions: members.length > 0 ? totalVolunteerSessions.toString() : '0',
      totalNhsMembers: totalNhsMembers.toString(),
      activeTutorsThisSemester: members.length > 0 ? activeTutorsDisplay : `0${currentSemesterName !== "N/A (Dates not set)" && currentSemesterName !== "Before Semester 1" && currentSemesterName !== "After Semester 2" ? ` (${currentSemesterName})` : ''}`,
      membersWithAtLeast1Hour: members.length > 0 ? membersWithAtLeast1Hour.toString() : '0',
      membersWithAtLeast5Hours: members.length > 0 ? membersWithAtLeast5Hours.toString() : '0',
      membersWithAtLeast10Hours: members.length > 0 ? membersWithAtLeast10Hours.toString() : '0',
      topTutorDisplay: members.length > 0 ? topTutorDisplay : 'N/A',
      daysLeftFor5RequiredHours: members.length > 0 ? daysLeftValue : 'N/A',
    };
  }, [uploadedHoursData]);


  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingAssets(true);
      setAssetError(null);
      const newIconSources: Record<string, string> = {};

      try {
        const creatureRes = await fetch('/assets/creature_base64.txt');
        if (!creatureRes.ok) throw new Error(`Failed to load assets/creature_base64.txt: ${creatureRes.statusText}`);
        const creatureBase64Data = await creatureRes.text();
        setCreatureSrc(creatureBase64Data.trim() ? `data:image/png;base64,${creatureBase64Data.trim()}` : TRANSPARENT_PIXEL);

        const giraffeRes = await fetch('/assets/giraffe_base64.txt');
        if (!giraffeRes.ok) throw new Error(`Failed to load assets/giraffe_base64.txt: ${giraffeRes.statusText}`);
        const giraffeBase64Data = await giraffeRes.text();
        setGiraffeSrc(giraffeBase64Data.trim() ? `data:image/png;base64,${giraffeBase64Data.trim()}` : TRANSPARENT_PIXEL);

        for (const id of NAV_BUTTON_IDS) {
          try {
            const iconRes = await fetch(`/assets/${id}_icon_base64.txt`);
            if (!iconRes.ok) {
              console.warn(`Failed to load assets/${id}_icon_base64.txt: ${iconRes.statusText}. Using transparent pixel.`);
              newIconSources[id] = TRANSPARENT_PIXEL;
            } else {
              const iconBase64Data = await iconRes.text();
              newIconSources[id] = iconBase64Data.trim() ? `data:image/png;base64,${iconBase64Data.trim()}` : TRANSPARENT_PIXEL;
            }
          } catch (iconErr) {
            console.error(`Error loading icon assets/${id}_icon_base64.txt:`, iconErr);
            newIconSources[id] = TRANSPARENT_PIXEL;
          }
        }
        setButtonIconSources(newIconSources);
      } catch (err) {
        console.error("Error loading assets:", err);
        setAssetError(err instanceof Error ? err.message : String(err));
        setCreatureSrc(TRANSPARENT_PIXEL);
        setGiraffeSrc(TRANSPARENT_PIXEL);
        NAV_BUTTON_IDS.forEach(id => newIconSources[id] = TRANSPARENT_PIXEL);
        setButtonIconSources(newIconSources);
      } finally {
        setIsLoadingAssets(false);
      }
    };
    fetchData();
  }, []);

  const openEventModal = (event: DynamicListItem) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const nextUpdate = () => {
    if (infoUpdates && currentUpdateIndex < infoUpdates.length - 1) {
      setCurrentUpdateIndex(currentUpdateIndex + 1);
    }
  };

  const prevUpdate = () => {
    if (currentUpdateIndex > 0) {
      setCurrentUpdateIndex(currentUpdateIndex - 1);
    }
  };

  const openChangelogModal = () => {
    if (changelogUpdates && changelogUpdates.length > 0) {
      setIsChangelogModalOpen(true);
    } else {
      console.log("No changelog data to display.");
    }
  };

  const closeChangelogModal = () => {
    setIsChangelogModalOpen(false);
  };

  const statisticsItems = [
    { label: "Total Hours Logged:", value: hourStatistics.totalHoursSum },
    { label: "Total Volunteer Sessions:", value: hourStatistics.totalVolunteerSessions },
    { label: "Total NHS Members:", value: hourStatistics.totalNhsMembers },
    { label: "Active Tutors This Semester:", value: hourStatistics.activeTutorsThisSemester },
    { label: "Members with at least 1 Hour:", value: hourStatistics.membersWithAtLeast1Hour },
    { label: "Members with at least 5 Hours:", value: hourStatistics.membersWithAtLeast5Hours },
    { label: "Members with at least 10 Hours:", value: hourStatistics.membersWithAtLeast10Hours },
    { label: "Top Tutor (Most Hours):", value: hourStatistics.topTutorDisplay },
    { label: "Days Left for 5 Required Hours:", value: hourStatistics.daysLeftFor5RequiredHours },
  ];

  return (
    <div className="min-h-screen p-3 md:p-4 flex flex-col bg-[var(--background-primary)]">
      <header className="text-center mb-6">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-2">
          <img src={creatureSrc} alt="NHS Mascot Creature" className="h-32 w-32 sm:h-40 md:h-56 object-contain"/>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[var(--text-primary)] tracking-wider leading-tight text-center">
            BHS' NHS<br />WEBSITE
          </h1>
          <img src={giraffeSrc} alt="NHS Mascot Giraffe" className="h-32 w-32 sm:h-40 md:h-56 object-contain"/>
        </div>
        {isLoadingAssets && <p className="text-lg text-[var(--text-secondary)]">Loading assets...</p>}
        {assetError && <p className="text-lg text-[var(--text-error)]">Asset Error: {assetError}</p>}
        {!isLoadingAssets && !assetError && <p className="text-2xl sm:text-3xl text-[var(--text-accent-splash)]">{splashText}</p>}
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col space-y-6 md:space-y-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4 px-1 text-center lg:text-left">Upcoming Dates</h2>
            <InfoBox className="bg-[var(--infoBoxBackground)] p-4 rounded-xl h-96">
              {upcomingEvents.length > 0 ? (
                <ul className="space-y-2">
                  {upcomingEvents.map((item: DynamicListItem) => (
                    <li key={item.id} className="text-lg sm:text-xl text-[var(--text-primary)]">
                      <button 
                        onClick={() => openEventModal(item)}
                        className="text-left w-full hover:bg-opacity-20 hover:bg-gray-500 p-1 rounded transition-colors"
                        aria-label={`View details for ${item.eventName}`}
                      >
                        <span className="font-semibold text-[var(--text-accent-info)]">{item.date}:</span> {item.eventName}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg text-center text-[var(--text-secondary)]">No upcoming dates.</p>
              )}
            </InfoBox>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4 px-1 text-center lg:text-left">Links</h2>
            <InfoBox className="bg-[var(--infoBoxBackground)] p-5 rounded-xl h-60">
              {links.length > 0 ? (
                <ul className="space-y-2 text-lg sm:text-xl text-[var(--text-primary)]">
                  {links.map((link: DynamicListItem) => (
                     <li key={link.id}>
                       <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-link-hover)] underline text-[var(--text-link)]">
                         {link.displayText}
                       </a>
                     </li>
                  ))}
                </ul>
              ) : (
                <p className="text-lg text-center text-[var(--text-secondary)]">No links available.</p>
              )}
            </InfoBox>
          </div>
        </div>

        {/* Center Column */}
        <div className="lg:col-span-1 flex flex-col items-center justify-center"> {/* Added justify-center */}
          <nav className="flex flex-col space-y-4 items-center w-full mb-4">
            {mainNavLinks.map((link: PageConfig) => (
              <Button
                key={link.id}
                to={link.path}
                iconSrc={buttonIconSources[link.id] || TRANSPARENT_PIXEL}
                className="w-full max-w-xl" 
              >
                {link.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 flex flex-col space-y-6 md:space-y-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4 px-1 text-center lg:text-left">Statistics</h2>
            <InfoBox className="bg-[var(--infoBoxBackground)] p-4 rounded-xl h-[24rem]">
              {uploadedHoursData && uploadedHoursData.members ? (
                <ul className="space-y-1 text-base sm:text-lg">
                  {statisticsItems.map(stat => (
                    <li key={stat.label} className="text-[var(--text-primary)] flex justify-between">
                      <span>{stat.label}</span>
                      <span className="font-semibold text-[var(--text-accent-info)] text-right pl-2">
                        {stat.value}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                 <p className="text-lg text-center text-[var(--text-secondary)]">Statistics are loading or unavailable.</p>
              )}
            </InfoBox>
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4 px-1 text-center lg:text-left">Info & Updates</h2>
            <InfoBox className="bg-[var(--infoBoxBackground)] p-5 rounded-xl h-60">
              {infoUpdates.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="flex-grow overflow-y-auto mb-2">
                    <div className="relative flex justify-center items-baseline mb-1">
                      <p className="absolute left-0 text-lg sm:text-xl text-[var(--text-accent-info)] whitespace-nowrap">
                        {infoUpdates[currentUpdateIndex]?.date}
                      </p>
                      <h4 className="text-lg sm:text-xl text-[var(--text-primary)] font-bold px-2">
                        {infoUpdates[currentUpdateIndex]?.header}
                      </h4>
                    </div>
                    <p className="text-base sm:text-lg text-[var(--text-secondary)] whitespace-pre-wrap break-words">{infoUpdates[currentUpdateIndex]?.content}</p>
                  </div>
                  {infoUpdates.length > 1 && (
                    <div className="flex justify-between items-center mt-auto">
                      <button 
                        onClick={prevUpdate} 
                        disabled={currentUpdateIndex === 0}
                        className="px-3 py-1 bg-[var(--button-primary-background)] text-[var(--buttonText)] rounded disabled:opacity-50 hover:bg-[var(--button-primary-background-hover)]"
                      >
                        Prev
                      </button>
                      <span className="text-sm text-[var(--text-tertiary)]">
                        {currentUpdateIndex + 1} / {infoUpdates.length}
                      </span>
                      <button 
                        onClick={nextUpdate} 
                        disabled={currentUpdateIndex === infoUpdates.length - 1}
                        className="px-3 py-1 bg-[var(--button-primary-background)] text-[var(--buttonText)] rounded disabled:opacity-50 hover:bg-[var(--button-primary-background-hover)]"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                 <p className="text-lg text-center text-[var(--text-secondary)]">No info or updates.</p>
              )}
            </InfoBox>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-6 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
        <div className="flex flex-col items-center sm:items-baseline sm:flex-row">
            <button 
              onClick={openChangelogModal}
              className="text-base sm:text-lg md:text-2xl text-[var(--text-footer)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--button-ring)] focus:ring-opacity-50 rounded px-1 py-0.5"
              aria-label={`View website changelog. Website last updated: ${displayWebsiteLastUpdated}. Hours last updated: ${displayHoursLastUpdated}.`}
              disabled={!changelogUpdates || changelogUpdates.length === 0}
            >
              {`Last Updated: ${displayWebsiteLastUpdated} | Hours Updated: ${displayHoursLastUpdated}`}
            </button>
        </div>
        <p className="text-base sm:text-lg md:text-2xl text-[var(--text-footer)] mt-2 sm:mt-0">
          Website By Isaac Hilderbrand
        </p>
      </footer>
      
      {selectedEvent && (
        <EventModal 
          isOpen={isEventModalOpen} 
          onClose={closeEventModal} 
          eventName={selectedEvent.eventName || 'Event Details'} 
          description={selectedEvent.description || 'No description available.'} 
        />
      )}

      {changelogUpdates && changelogUpdates.length > 0 && (
        <ChangelogModal
          isOpen={isChangelogModalOpen}
          onClose={closeChangelogModal}
          updates={changelogUpdates}
        />
      )}
    </div>
  );
};

export default HomePage;