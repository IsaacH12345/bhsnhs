
export interface PageConfig {
  id: string;
  label: string;
  path: string;
}

export interface StatisticItem {
  id: string;
  label: string;
  value: string | number;
}

// For Upcoming Events, Links, InfoUpdates, ChangelogUpdates
export interface DynamicListItem {
  id: string; // Unique ID for React keys
  date?: string;
  eventName?: string;
  description?: string;
  displayText?: string;
  url?: string;
  header?: string;
  content?: string; // Used for InfoUpdate content and Changelog description
}


// For the main aggregated table display in HoursTable.tsx
export interface AggregatedParsedRow {
  "Member Name": string;
  "Semester 1 Hours": number;
  "Semester 2 Hours": number;
  "Total Hours": number;
  // Allow other string/number properties for flexibility if headers change
  [header: string]: string | number;
}

export interface AggregatedParsedTableData {
  headers: string[];
  rows: AggregatedParsedRow[];
}

// New types for detailed daily data
export interface DailyHourDetail {
  date: string; // Formatted as MM/DD/YYYY
  session: "AM" | "PM";
  hours: number;
  semester: 1 | 2;
}

export interface AdditionalHourEntry {
  date: string; // Formatted as MM/DD/YYYY
  hours: number;
  notes: string;
  semester: 1 | 2;
}

export interface MemberDetailedHours {
  memberName: string;
  semester1Hours: number;
  semester2Hours: number;
  totalHours: number;
  dailyDetails: DailyHourDetail[];
  additionalHourDetails: AdditionalHourEntry[]; // New field for additional hours
}

export interface OfficerInfo {
  id: string;
  name: string;
  role: string;
  email: string;
  description: string;
  imageBase64: string;
  secondaryImageBase64?: string | null; // Added for secondary image
}

// For Member Proficiency Details Page
export interface CourseDetail {
  name: string;
  color: string; // hex code
}

export interface SubjectDetails {
  id: string; // e.g., 'math'
  name: string; // e.g., "Math"
  color: string; // hex code for the subject itself
  courses: CourseDetail[];
  courseNameMap: Map<string, CourseDetail>; // For quick lookup: courseName.toLowerCase() -> CourseDetail
}

export interface MemberProficiencyInSubject {
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  proficientCoursesInSubject: CourseDetail[];
  count: number;
}

export interface MemberProficiencyInfo {
  id: string; // Unique ID for React keys
  name: string;
  proficienciesBySubject: MemberProficiencyInSubject[];
}

// For Study Resources Page
export interface GeneralTag {
  id: string; // e.g., 'worksheet', 'video-lecture'
  name: string; // e.g., "Worksheet", "Video Lecture"
}

export interface ResourceSubject {
  id: string; // subjectId
  name: string;
  color: string;
}

export interface ResourceCourse {
  name: string;
  color: string;
  subjectId: string;
}

export interface StudyResource {
  id: string;
  name: string;
  description: string;
  downloadLink: string | null;
  generalTags: GeneralTag[];
  matchedSubjects: ResourceSubject[];
  matchedCourses: ResourceCourse[];
}

// For Meeting Information Page
export interface MeetingInfoItem {
  id: string;
  title: string;
  date: string; // Formatted display date (e.g., "19 June 2025")
  rawDate: Date | null; // JS Date object for sorting/filtering
  startTime: string; // Formatted "HH:MMam/pm"
  endTime: string;   // Formatted "HH:MMam/pm"
  length: string; // New field for meeting duration
  notes: string;
}


// This will be the main data structure passed from AdminPage and stored in App's state
export interface DetailedHoursData {
  // Headers for the aggregated view table: ["Member Name", "Semester 1 Hours", "Semester 2 Hours", "Total Hours"]
  aggregatedHeaders: string[];
  members: MemberDetailedHours[];

  websiteLastUpdatedDateTime: string | null; // From Information B1
  hoursLastUpdatedDateTime: string | null;   // From Information B2 (replaces old lastUpdatedDateTime for hours)

  sem1StartDate: Date | null; // From Information B3
  sem2StartDate: Date | null; // From Information B4
  sem2EndDate: Date | null;   // From Information B5

  upcomingEvents: DynamicListItem[] | null; // From Information A8, B8, C8 onwards
  links: DynamicListItem[] | null;          // From Information E8, F8 onwards
  infoUpdates: DynamicListItem[] | null;    // From Information H8, I8, J8 onwards
  changelogUpdates: DynamicListItem[] | null; // From Information L8, M8 onwards
  officerDetails: OfficerInfo[] | null; // From "Officers" sheet
  memberProficiencies: MemberProficiencyInfo[] | null; // From "MemberDetails" sheet
  subjectsData: SubjectDetails[] | null; // Parsed data from "Subjects" sheet (Sheet 6)

  suggestionsText: string | null; // From Information O8
  suggestionsButtonUrl: string | null; // From Information P8
  splashTexts: string[] | null; // From Information R2 downwards - NEW

  studyResources: StudyResource[] | null; // From "StudyResources" sheet (Sheet 7)
  availableGeneralTags: GeneralTag[] | null; // List of all possible general tags from "StudyResources" sheet Row 1

  meetingInfo: MeetingInfoItem[] | null; // From "MeetingInfo" sheet (Sheet 8)
}