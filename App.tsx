
import React, { useState, useCallback, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import HomePage from './pages/HomePage';
import OfficerDetailsPage from './pages/OfficerDetailsPage';
import HoursTrackerPage from './pages/HoursTrackerPage';
import MemberDetailsPage from './pages/MemberDetailsPage';
import SuggestionsPage from './pages/SuggestionsPage';
import StudyResourcesPage from './pages/StudyResourcesPage';
import MeetingInfoPage from './pages/MeetingInfoPage'; // New Meeting Info Page
import { NAVIGATION_LINKS } from './constants';
import theme from './styles/theme';
import { DetailedHoursData } from './types';
import { parseSpreadsheetData } from './utils/spreadsheetParser';
// import ContentPage from './pages/ContentPage'; // No longer used

declare var XLSX: any;


const App: React.FC = () => {
  const [uploadedHoursData, setUploadedHoursData] = useState<DetailedHoursData | null>(null);
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState<boolean>(true);
  const [spreadsheetError, setSpreadsheetError] = useState<string | null>(null);

  useEffect(() => {
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--background-primary', theme.colors.backgroundPrimary);
    rootStyle.setProperty('--background-secondary', theme.colors.backgroundSecondary);
    rootStyle.setProperty('--infoBoxBackground', theme.colors.infoBoxBackground);
    rootStyle.setProperty('--contentPageBackground', theme.colors.contentPageBackground);
    rootStyle.setProperty('--contentPageBoxBackground', theme.colors.contentPageBoxBackground);
    rootStyle.setProperty('--adminPanelBoxBackground', theme.colors.adminPanelBoxBackground);
    rootStyle.setProperty('--tableHeaderBackground', theme.colors.tableHeaderBackground);
    rootStyle.setProperty('--tableRowEvenBackground', theme.colors.tableRowEvenBackground);
    rootStyle.setProperty('--tableRowOddBackground', theme.colors.tableRowOddBackground);

    rootStyle.setProperty('--text-primary', theme.colors.textPrimary);
    rootStyle.setProperty('--text-secondary', theme.colors.textSecondary);
    rootStyle.setProperty('--text-tertiary', theme.colors.textTertiary);
    rootStyle.setProperty('--text-accent-splash', theme.colors.textAccentSplash);
    rootStyle.setProperty('--text-accent-info', theme.colors.textAccentInfo);
    rootStyle.setProperty('--text-link', theme.colors.textLink);
    rootStyle.setProperty('--text-link-hover', theme.colors.textLinkHover);
    rootStyle.setProperty('--text-error', theme.colors.textError);
    rootStyle.setProperty('--text-footer', theme.colors.textFooter);
    rootStyle.setProperty('--buttonText', theme.colors.buttonText);
    rootStyle.setProperty('--tableTextHeader', theme.colors.tableTextHeader);
    rootStyle.setProperty('--tableTextPrimary', theme.colors.tableTextPrimary);

    rootStyle.setProperty('--button-primary-background', theme.colors.buttonPrimaryBackground);
    rootStyle.setProperty('--button-primary-background-hover', theme.colors.buttonPrimaryBackgroundHover);
    rootStyle.setProperty('--button-ring', theme.colors.buttonRing);

    rootStyle.setProperty('--tableBorderColor', theme.colors.tableBorderColor);

    const scrollbarStyleId = 'dynamic-scrollbar-styles';
    let scrollbarStyleElement = document.getElementById(scrollbarStyleId);
    if (!scrollbarStyleElement) {
        scrollbarStyleElement = document.createElement('style');
        scrollbarStyleElement.id = scrollbarStyleId;
        document.head.appendChild(scrollbarStyleElement);
    }
    scrollbarStyleElement.textContent = `
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        ::-webkit-scrollbar-track {
            background: ${theme.colors.scrollbarTrack};
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
            background: ${theme.colors.scrollbarThumb};
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: ${theme.colors.scrollbarThumbHover};
        }
    `;
  }, []);

  useEffect(() => {
    const loadSpreadsheet = async () => {
      setIsLoadingSpreadsheet(true);
      setSpreadsheetError(null);
      try {
        const response = await fetch('/NHSExcel.xlsx');
        if (!response.ok) {
          if (response.status === 404) {
            console.warn('NHSExcel.xlsx not found in the root directory.');
            throw new Error('NHSExcel.xlsx not found. Please place it in the root directory of the website.');
          } else {
            throw new Error(`Failed to fetch NHSExcel.xlsx: ${response.statusText}`);
          }
        }
        const arrayBuffer = await response.arrayBuffer();
        const parsedData = await parseSpreadsheetData(arrayBuffer);

        if (parsedData) {
          setUploadedHoursData(parsedData);
          console.log("Spreadsheet data processed from NHSExcel.xlsx:", parsedData);
        } else {
          setUploadedHoursData(null);
          throw new Error("Failed to parse NHSExcel.xlsx. Please check its format and content.");
        }
      } catch (err) {
        console.error("Error loading or parsing spreadsheet:", err);
        setUploadedHoursData(null);
        setSpreadsheetError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoadingSpreadsheet(false);
      }
    };
    loadSpreadsheet();
  }, []);

  return (
      <div className="min-h-screen bg-[var(--background-secondary)] text-[var(--text-primary)] font-mono">
        <ReactRouterDOM.Routes>
          <ReactRouterDOM.Route path="/" element={<HomePage uploadedHoursData={uploadedHoursData} />} />
          {NAVIGATION_LINKS.slice(1).map(link => {
            if (link.id === "hours") {
              return (
                <ReactRouterDOM.Route
                  key={link.id}
                  path={link.path}
                  element={<HoursTrackerPage
                              navigationPageTitle={link.label}
                              uploadedHoursData={uploadedHoursData}
                              isLoading={isLoadingSpreadsheet}
                              error={spreadsheetError}
                            />}
                />
              );
            }
            if (link.id === "meeting-info") { // Route for Meeting Information
              return (
                <ReactRouterDOM.Route
                  key={link.id}
                  path={link.path}
                  element={<MeetingInfoPage
                              pageTitle={link.label}
                              uploadedHoursData={uploadedHoursData}
                              isLoading={isLoadingSpreadsheet}
                              error={spreadsheetError}
                            />}
                />
              );
            }
            if (link.id === "officer-details") {
              return (
                <ReactRouterDOM.Route
                  key={link.id}
                  path={link.path}
                  element={<OfficerDetailsPage
                              pageTitle={link.label}
                              uploadedHoursData={uploadedHoursData}
                              isLoading={isLoadingSpreadsheet}
                              error={spreadsheetError}
                            />}
                />
              );
            }
            if (link.id === "member-details") {
              return (
                <ReactRouterDOM.Route
                  key={link.id}
                  path={link.path}
                  element={<MemberDetailsPage
                              pageTitle={link.label}
                              uploadedHoursData={uploadedHoursData}
                              isLoading={isLoadingSpreadsheet}
                              error={spreadsheetError}
                            />}
                />
              );
            }
            if (link.id === "suggestions") {
              return (
                <ReactRouterDOM.Route
                  key={link.id}
                  path={link.path}
                  element={<SuggestionsPage
                              pageTitle={link.label}
                              uploadedHoursData={uploadedHoursData}
                              isLoading={isLoadingSpreadsheet}
                              error={spreadsheetError}
                            />}
                />
              );
            }
            if (link.id === "study-resources") {
              return (
                <ReactRouterDOM.Route
                  key={link.id}
                  path={link.path}
                  element={<StudyResourcesPage
                              pageTitle={link.label}
                              uploadedHoursData={uploadedHoursData}
                              isLoading={isLoadingSpreadsheet}
                              error={spreadsheetError}
                            />}
                />
              );
            }
            // If no specific page component is matched, it implies an issue or unhandled link.
            // Previously ContentPage was a fallback, but now all nav links should have specific pages.
            // We can redirect to home or show an error for unhandled paths.
            // For now, let's log a warning and not render a route for unmapped links.
            console.warn(`No specific page component defined for navigation link: ${link.label} (${link.path})`);
            return null;
          })}
          <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to="/" replace />} />
        </ReactRouterDOM.Routes>
      </div>
  );
};

const AppWrapper: React.FC = () => (
  <ReactRouterDOM.HashRouter>
    <App />
  </ReactRouterDOM.HashRouter>
);

export default AppWrapper;
