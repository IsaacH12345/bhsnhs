
export interface ColorPalette {
  // Backgrounds
  backgroundPrimary: string;
  backgroundSecondary: string;
  infoBoxBackground: string;
  adminModalInputBackground: string; // Added back for search input
  contentPageBackground: string;
  contentPageBoxBackground: string;
  adminPanelBoxBackground: string;
  tableHeaderBackground: string; 
  tableRowEvenBackground: string; 
  tableRowOddBackground: string; 

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textAccentSplash: string;
  textAccentInfo: string;
  textLink: string;
  textLinkHover: string;
  textError: string;
  textFooter: string;
  buttonText: string;
  tableTextHeader: string; 
  tableTextPrimary: string; 


  // Buttons
  buttonPrimaryBackground: string;
  buttonPrimaryBackgroundHover: string;
  buttonRing: string;
  // buttonCancelBackground: string; // Removed
  // buttonCancelBackgroundHover: string; // Removed
  // buttonSubmitBackground: string; // Removed
  // buttonSubmitBackgroundHover: string; // Removed
  // buttonDangerBackground: string; // Removed
  // buttonDangerBackgroundHover: string; // Removed
  // buttonSecondaryBackground: string; // Removed
  // buttonSecondaryBackgroundHover: string; // Removed
  
  // Borders & Rings
  adminModalInputBorder: string; // Added back for search input
  adminModalFocusRing: string; // Added back for search input
  tableBorderColor: string; 

  // Scrollbar
  scrollbarTrack: string;
  scrollbarThumb: string;
  scrollbarThumbHover: string;
}

export interface Theme {
  colors: ColorPalette;
}

export const theme: Theme = {
  colors: {
    // Backgrounds
    backgroundPrimary: '#090E19', 
    backgroundSecondary: '#121212', 
    infoBoxBackground: '#141D2B', 
    adminModalInputBackground: '#121212', // Initialized here
    contentPageBackground: '#1E1B2E',
    contentPageBoxBackground: '#2A2640',
    adminPanelBoxBackground: '#1A1D2A', 
    tableHeaderBackground: '#282C34', 
    tableRowEvenBackground: '#21252B', 
    tableRowOddBackground: '#2C313A',  


    // Text
    textPrimary: '#D4D4D4', 
    textSecondary: '#B0B0B0', 
    textTertiary: '#9CA3AF',  
    textAccentSplash: '#D9C28D',
    textAccentInfo: '#0091C4', 
    textLink: '#E5E5E5', 
    textLinkHover: '#FFFFFF', 
    textError: '#F87171', 
    textFooter: '#D1D5DB', 
    buttonText: '#EAE4DA', 
    tableTextHeader: '#FFFFFF', 
    tableTextPrimary: '#E0E0E0', 

    // Buttons
    buttonPrimaryBackground: '#103266',
    buttonPrimaryBackgroundHover: '#16468E',
    buttonRing: '#6F6AA0',
    // buttonCancelBackground: '#3A3A3A', 
    // buttonCancelBackgroundHover: '#505050', 
    // buttonSubmitBackground: '#5C1C26', 
    // buttonSubmitBackgroundHover: '#6B2F39', 
    // buttonDangerBackground: '#DC2626', 
    // buttonDangerBackgroundHover: '#F87171', 
    // buttonSecondaryBackground: '#4B5563', 
    // buttonSecondaryBackgroundHover: '#6B7280', 
    
    // Borders & Rings
    adminModalInputBorder: '#4A4466', // Initialized here
    adminModalFocusRing: '#6F6AA0', // Initialized here
    tableBorderColor: '#3A3A5A', 


    // Scrollbar
    scrollbarTrack: '#E6EBF0',
    scrollbarThumb: '#0D0D0D',
    scrollbarThumbHover: '#262626',
  },
};
// The lines below are now redundant if initialized above, but kept for explicitness if needed for overrides.
// If these values are intended to be the *only* place they are set, then they should not be in the initial object.
// However, interfaces require them to be defined for the object type.
// For clarity and to match the previous structure's intent (where they were explicitly set after initial theme object creation),
// we initialize them in the main object.
// theme.colors.adminModalInputBackground = '#121212';
// theme.colors.adminModalInputBorder = '#4A4466';
// theme.colors.adminModalFocusRing = '#6F6AA0';


export default theme;