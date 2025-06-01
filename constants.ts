import { PageConfig, StatisticItem, DateItem } from './types';

// SPLASH_TEXTS moved to data/splashTexts.ts

export const NAVIGATION_LINKS: PageConfig[] = [
  { id: "home", label: "Home", path: "/" },
  { id: "about", label: "About Us", path: "/about" },
  { id: "events", label: "Events", path: "/events" },
  { id: "projects", label: "Projects", path: "/projects" },
  { id: "contact", label: "Contact", path: "/contact" },
  { id: "gallery", label: "Gallery", path: "/gallery" },
];

// IMPORTANT: This is a placeholder password for demonstration purposes ONLY.
// In a real application, this MUST be handled by a secure backend authentication system.
// DO NOT use this method for production environments.
export const ADMIN_PASSWORD_PLACEHOLDER = "nhsAdmin2024!"; 

export const MOCK_STATISTICS: StatisticItem[] = [
  { id: "1", label: "Active Members", value: 120 },
  { id: "2", label: "Service Hours (Year)", value: "3,500+" },
  { id: "3", label: "Community Projects", value: 15 },
  { id: "4", label: "Scholarships Awarded", value: 8 },
  { id: "5", label: "Years Established", value: 25 },
  { id: "6", label: "Successful Fundraisers", value: 5 },
];

export const MOCK_UPCOMING_DATES: DateItem[] = [
  { id: "1", date: "2024-09-15", event: "Fall Induction Ceremony" },
  { id: "2", date: "2024-10-05", event: "Community Cleanup Drive" },
  { id: "3", date: "2024-11-12", event: "Guest Speaker: Local Leader" },
  { id: "4", date: "2024-12-01", event: "Holiday Charity Event Planning" },
  { id: "5", date: "2025-01-20", event: "MLK Day of Service" },
  { id: "6", date: "2025-02-10", event: "Chapter Meeting" },
  { id: "7", date: "2025-03-22", event: "Spring Fundraiser Gala" },
];