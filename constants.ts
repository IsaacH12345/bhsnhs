
import { PageConfig } from './types';

// SPLASH_TEXTS moved to data/splashTexts.ts

export const NAVIGATION_LINKS: PageConfig[] = [
  { id: "home", label: "Home", path: "/home" },
  { id: "hours", label: "Hours Tracker", path: "/hours" }, // Was "About Us"
  { id: "meeting-info", label: "Meeting Information", path: "/meeting-info" }, // Was "Events"
  { id: "suggestions", label: "Suggestions", path: "/suggestions" }, // Was "Projects"
  { id: "officer-details", label: "Officer Details", path: "/officer-details" }, // Was "Contact"
  { id: "member-details", label: "Member Details", path: "/member-details" }, // Was "/gallery"
  { id: "study-resources", label: "Study Resources", path: "/study-resources" }, // Changed from Tutee Details
];

// MOCK_UPCOMING_DATES removed