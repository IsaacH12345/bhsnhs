
import { PageConfig } from './types';

// SPLASH_TEXTS moved to data/splashTexts.ts

export const NAVIGATION_LINKS: PageConfig[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "hours", label: "Hours Tracker", path: "/about" }, // Was "About Us"
  { id: "meeting-info", label: "Meeting Information", path: "/events" }, // Was "Events"
  { id: "suggestions", label: "Suggestions", path: "/projects" }, // Was "Projects"
  { id: "officer-details", label: "Officer Details", path: "/contact" }, // Was "Contact"
  { id: "member-details", label: "Member Details", path: "/member-details" }, // Was "/gallery"
  { id: "study-resources", label: "Study Resources", path: "/study-resources" }, // Changed from Tutee Details
];

// MOCK_UPCOMING_DATES removed