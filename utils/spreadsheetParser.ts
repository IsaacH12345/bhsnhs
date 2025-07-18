
import { DetailedHoursData, MemberDetailedHours, DailyHourDetail, DynamicListItem, OfficerInfo, AdditionalHourEntry, MemberProficiencyInfo, SubjectDetails, CourseDetail, MemberProficiencyInSubject, StudyResource, GeneralTag, MeetingInfoItem, ResourceSubject, ResourceCourse } from '../types';

// Make XLSX globally available from CDN
declare var XLSX: any;

const TRANSPARENT_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const DEFAULT_SUBJECT_COLOR = '#6B7280'; // A medium gray for tags if color is missing/invalid
const DEFAULT_COURSE_COLOR = '#4B5563'; // A slightly different gray for courses

// Helper to parse Excel dates (numbers or strings) into JS Date objects
const parseExcelDate = (excelDate: any): Date | null => {
  if (excelDate === null || excelDate === undefined || excelDate === "") return null;
  let dateObj: Date | null = null;
  if (typeof excelDate === 'number') {
    // Attempt to parse as Excel date serial number
    // XLSX.SSF.parse_date_code returns an object {y,m,d,...}
    // The default epoch for XLSX is 1899-12-30 (day 0) not 1899-12-31 (day 1)
    // For numbers, it's safer to use this or ensure sheet is not in 1904 date system if manually calculating
    const jsDateFromNum = XLSX.SSF.parse_date_code(excelDate);
    if (jsDateFromNum) {
      dateObj = new Date(jsDateFromNum.y, jsDateFromNum.m - 1, jsDateFromNum.d, jsDateFromNum.H || 12, jsDateFromNum.M || 0, jsDateFromNum.S || 0);
    }
  } else if (typeof excelDate === 'string') {
    // Try to parse common string date formats
    const parts = excelDate.match(/(\d{1,2})[/\.-](\d{1,2})[/\.-](\d{2,4})/);
    if (parts) {
        const d = parseInt(parts[2], 10);
        const m = parseInt(parts[1], 10) -1; // JS months are 0-indexed
        let y = parseInt(parts[3], 10);
        if (y < 100) { // Handle YY format
            y = y > 50 ? 1900 + y : 2000 + y; // Pivoting around xx50
        }
        dateObj = new Date(y, m, d, 12,0,0); // Assume noon to avoid timezone issues with just date
    } else {
       // Fallback for more general date strings (less reliable without format knowledge)
       const parsedGeneralDate = new Date(excelDate + "T12:00:00"); // Append time to help parser
       if (!isNaN(parsedGeneralDate.getTime())) {
           dateObj = parsedGeneralDate;
       }
    }
  }
  if (dateObj && !isNaN(dateObj.getTime())) {
    return dateObj;
  }
  console.warn("Failed to parse Excel date:", excelDate);
  return null;
};

// Helper to format Excel time values (numbers from 0-1 or parsable time strings)
const formatExcelTime = (excelTime: any, workbookDate1904?: boolean): string => {
  if (excelTime === null || excelTime === undefined || excelTime === "") return "N/A";

  if (typeof excelTime === 'number' && excelTime >= 0 && excelTime < 1) {
    // It's an Excel time serial number (fraction of a day)
    return XLSX.SSF.format('h:mm AM/PM', excelTime);
  } else if (typeof excelTime === 'string') {
    // Try to parse common time strings if needed, or if it's already formatted, return it.
    // For simplicity, if it's a string, we assume it's either parsable by Date or pre-formatted.
    // A more robust solution would parse specific string formats e.g. "HH:MM" or "H AM/PM"
    const d = new Date(`1/1/1970 ${excelTime}`); // Use a dummy date to parse time string
    if (!isNaN(d.getTime())) {
      let hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
      return `${hours}:${minutesStr}${ampm}`;
    }
    return excelTime; // Fallback to returning the string as is
  } else if (excelTime instanceof Date) { // If cellDates=true was used and it became a Date object
      let hours = excelTime.getHours();
      const minutes = excelTime.getMinutes();
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const minutesStr = minutes < 10 ? '0' + minutes : minutes.toString();
      return `${hours}:${minutesStr}${ampm}`;
  }
  
  console.warn("Could not format time from value:", excelTime);
  return "N/A";
};


// Helper to format JS Date to MM/DD/YYYY
const formatDateStandard = (date: Date | null): string => {
  if (!date) return "";
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
};

// Helper to format JS Date to "DD MMMM YYYY"
const formatDateForHomePage = (date: Date | null): string | null => {
  if (!date || isNaN(date.getTime())) return null;

  const day = date.getDate().toString().padStart(2, '0');
  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
};

// Helper to validate and format hex colors
function validateAndFormatHex(rawColor: string | undefined, defaultValue: string, context: string): string {
  if (!rawColor) {
    // console.warn(`Missing hex color for ${context}. Using default ${defaultValue}.`); // Reduced verbosity
    return defaultValue;
  }
  let color = rawColor.toString().trim();
  if (!color.startsWith('#')) {
    color = '#' + color;
  }
  if (/^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color)) { // Allow 3-digit hex
    return color.toUpperCase();
  } else {
    console.warn(`Invalid hex color format '${rawColor}' for ${context} (Original Excel: '${rawColor}'). Using default ${defaultValue}.`);
    return defaultValue;
  }
}

// Helper to create a slug-like ID from a name
const createIdFromName = (name: string): string => {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};


export const parseSpreadsheetData = async (arrayBuffer: ArrayBuffer): Promise<DetailedHoursData | null> => {
  try {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array', cellDates: false });
    const date1904 = workbook.Workbook?.WBProps?.date1904 || false;

    const finalParsedData: Partial<DetailedHoursData> = {};


    // --- Parse "Information" Sheet (Sheet 3, index 2) ---
    let websiteLastUpdatedDateTime: string | null = 'N/A';
    let hoursLastUpdatedDateTime: string | null = 'N/A';
    let sem1StartDate: Date | null = null;
    let sem2StartDate: Date | null = null;
    let sem2EndDate: Date | null = null;
    let upcomingEvents: DynamicListItem[] = [];
    let links: DynamicListItem[] = [];
    let infoUpdates: DynamicListItem[] = [];
    let changelogUpdates: DynamicListItem[] = [];
    let suggestionsText: string | null = null;
    let suggestionsButtonUrl: string | null = null;
    let parsedSplashTexts: string[] = [];

    if (workbook.SheetNames.length < 3) {
      console.warn("Third sheet 'Information' not found. Metadata and dynamic content will be unavailable. Ensure NHSExcel.xlsx has at least 3 sheets in the correct order.");
    } else {
      const infoSheetName = workbook.SheetNames[2];
      const infoWorksheet = workbook.Sheets[infoSheetName];
      const infoAOA: any[][] = XLSX.utils.sheet_to_json(infoWorksheet, { header: 1, defval: "" });

      if (infoAOA.length < 5) {
          console.warn("'Information' sheet (Sheet 3) has too few rows for essential metadata (B1-B5).");
      }

      const websiteLastUpdatedExcel = infoAOA[0]?.[1];
      const hoursLastUpdatedExcel = infoAOA[1]?.[1];
      const sem1StartDateExcel = infoAOA[2]?.[1];
      const sem2StartDateExcel = infoAOA[3]?.[1];
      const sem2EndDateExcel = infoAOA[4]?.[1];

      websiteLastUpdatedDateTime = formatDateForHomePage(parseExcelDate(websiteLastUpdatedExcel));
      hoursLastUpdatedDateTime = formatDateForHomePage(parseExcelDate(hoursLastUpdatedExcel));
      sem1StartDate = parseExcelDate(sem1StartDateExcel);
      sem2StartDate = parseExcelDate(sem2StartDateExcel);
      sem2EndDate = parseExcelDate(sem2EndDateExcel);

      if (!sem1StartDate) {
          console.error("CRITICAL: Semester 1 Start Date (Cell B3 on 'Information' sheet) is missing or invalid. Hour calculations will be affected.");
      }

      // Parse Splash Texts from Column R (index 17), starting from Row 2 (index 1 in infoAOA)
      if (infoAOA.length > 1) {
        for (let i = 1; i < infoAOA.length; i++) { // Start from Excel row 2 (infoAOA index 1)
          const splashTextCell = infoAOA[i]?.[17]; // Column R
          if (splashTextCell) {
            const textValue = String(splashTextCell).trim();
            if (textValue) {
              parsedSplashTexts.push(textValue);
            }
          }
        }
      }
      finalParsedData.splashTexts = parsedSplashTexts.length > 0 ? parsedSplashTexts : null;


      if (infoAOA.length > 7) {
        const row8Data = infoAOA[7];
        suggestionsText = row8Data[14]?.toString().trim() || null;
        suggestionsButtonUrl = row8Data[15]?.toString().trim() || null;
      } else {
        console.warn("'Information' sheet (Sheet 3) does not have data in row 8 (Excel row) for Suggestions (O8, P8).");
      }

      for (let i = 7; i < infoAOA.length; i++) {
        const row = infoAOA[i];
        if (row[0] || row[1] || row[2]) {
          const eventDateRaw = row[0];
          const eventDateParsed = parseExcelDate(eventDateRaw);
          upcomingEvents.push({
            id: `event-${i}`,
            date: eventDateParsed ? formatDateForHomePage(eventDateParsed) : (typeof eventDateRaw === 'string' ? eventDateRaw.trim() : ''),
            eventName: row[1]?.toString().trim() || '',
            description: row[2]?.toString().trim() || '',
          });
        }
        if (row[4] || row[5]) {
          links.push({
            id: `link-${i}`,
            displayText: row[4]?.toString().trim() || '',
            url: row[5]?.toString().trim() || '',
          });
        }
        if (row[7] || row[8] || row[9]) {
          const updateDateRaw = row[7];
          const updateDateParsed = parseExcelDate(updateDateRaw);
          infoUpdates.push({
            id: `update-${i}`,
            date: updateDateParsed ? formatDateForHomePage(updateDateParsed) : (typeof updateDateRaw === 'string' ? updateDateRaw.trim() : ''),
            header: row[8]?.toString().trim() || '',
            content: row[9]?.toString().trim() || '',
          });
        }
        if (row[11] || row[12]) {
          const changelogDateRaw = row[11];
          const changelogDateParsed = parseExcelDate(changelogDateRaw);
          changelogUpdates.push({
            id: `changelog-${i}`,
            date: changelogDateParsed ? formatDateForHomePage(changelogDateParsed) : (typeof changelogDateRaw === 'string' ? changelogDateRaw.trim() : ''),
            content: row[12]?.toString().trim() || '',
          });
        }
      }
    }
    finalParsedData.websiteLastUpdatedDateTime = websiteLastUpdatedDateTime || 'N/A';
    finalParsedData.hoursLastUpdatedDateTime = hoursLastUpdatedDateTime || 'N/A';
    finalParsedData.sem1StartDate = sem1StartDate;
    finalParsedData.sem2StartDate = sem2StartDate;
    finalParsedData.sem2EndDate = sem2EndDate;
    finalParsedData.upcomingEvents = upcomingEvents.length > 0 ? upcomingEvents : null;
    finalParsedData.links = links.length > 0 ? links : null;
    finalParsedData.infoUpdates = infoUpdates.length > 0 ? infoUpdates : null;
    finalParsedData.changelogUpdates = changelogUpdates.length > 0 ? changelogUpdates : null;
    finalParsedData.suggestionsText = suggestionsText;
    finalParsedData.suggestionsButtonUrl = suggestionsButtonUrl;

    // --- Parse "HourTracker" Sheet (Sheet 1, index 0) ---
    const hourSheetName = workbook.SheetNames[0];
    if (!hourSheetName) throw new Error("First sheet 'HourTracker' not found.");
    const hourWorksheet = workbook.Sheets[hourSheetName];
    const hourAOA: any[][] = XLSX.utils.sheet_to_json(hourWorksheet, { header: 1, defval: "" });

    if (hourAOA.length < 5) {
      throw new Error("'HourTracker' sheet (Sheet 1) has too few rows. Expected data starting from Row 1 for dates, Row 5 for members.");
    }

    const dailyDatesRow = hourAOA[1];
    const ampmRow = hourAOA[2];

    if (!dailyDatesRow || !ampmRow) {
        throw new Error("Daily Date (Excel Row 2 on 'HourTracker' sheet) or AM/PM (Excel Row 3 on 'HourTracker' sheet) rows are missing or empty.");
    }

    const dailyDateSlotsInfo: Array<{ dailyJsDate: Date | null, formattedDate: string, amColIndex: number, pmColIndex: number }> = [];
    for (let dateColIdx = 1; dateColIdx < dailyDatesRow.length; dateColIdx += 2) {
      const dateVal = dailyDatesRow[dateColIdx];
      const dailyJsDate = parseExcelDate(dateVal);

      if (dailyJsDate) {
        dailyDateSlotsInfo.push({
          dailyJsDate,
          formattedDate: formatDateStandard(dailyJsDate),
          amColIndex: dateColIdx,
          pmColIndex: dateColIdx + 1
        });
      }
    }

    const aggregatedTableHeaders: string[] = ["Member Name", "Semester 1 Hours", "Semester 2 Hours", "Total Hours"];
    const parsedMembers: MemberDetailedHours[] = [];

    for (let dataRowIdx = 4; dataRowIdx < hourAOA.length; dataRowIdx++) {
      const memberNameCell = hourAOA[dataRowIdx][0];
      const memberName = memberNameCell ? memberNameCell.toString().trim() : "";

      if (!memberName) continue;

      let semester1Hours = 0;
      let semester2Hours = 0;
      const dailyDetails: DailyHourDetail[] = [];

      if (!finalParsedData.sem1StartDate) {
        console.error(`Semester 1 Start Date is not available for member ${memberName}; cannot process tutoring hours accurately.`);
        parsedMembers.push({
          memberName,
          semester1Hours: 0,
          semester2Hours: 0,
          totalHours: 0,
          dailyDetails: [],
          additionalHourDetails: [],
        });
        continue;
      }

      for (const slotInfo of dailyDateSlotsInfo) {
        if (!slotInfo.dailyJsDate) continue;

        const amHoursCell = (slotInfo.amColIndex < hourAOA[dataRowIdx].length) ? hourAOA[dataRowIdx][slotInfo.amColIndex] : "";
        const pmHoursCell = (slotInfo.pmColIndex < hourAOA[dataRowIdx].length) ? hourAOA[dataRowIdx][slotInfo.pmColIndex] : "";

        const amHours = isNaN(parseFloat(amHoursCell.toString())) ? 0 : parseFloat(amHoursCell.toString());
        const pmHours = isNaN(parseFloat(pmHoursCell.toString())) ? 0 : parseFloat(pmHoursCell.toString());

        let dailyTotalForSemesterCalc = 0;
        let currentSemester : 1 | 2 = 1;

        if (finalParsedData.sem2StartDate && slotInfo.dailyJsDate >= finalParsedData.sem2StartDate) {
            currentSemester = 2;
            if (finalParsedData.sem2EndDate && slotInfo.dailyJsDate >= finalParsedData.sem2EndDate) {
                continue;
            }
            dailyTotalForSemesterCalc = amHours + pmHours;
            semester2Hours += dailyTotalForSemesterCalc;
        } else if (finalParsedData.sem1StartDate && slotInfo.dailyJsDate >= finalParsedData.sem1StartDate) {
            currentSemester = 1;
            dailyTotalForSemesterCalc = amHours + pmHours;
            semester1Hours += dailyTotalForSemesterCalc;
        } else {
            continue;
        }

        if (amHours > 0) {
          dailyDetails.push({ date: slotInfo.formattedDate, session: "AM", hours: amHours, semester: currentSemester });
        }
        if (pmHours > 0) {
          dailyDetails.push({ date: slotInfo.formattedDate, session: "PM", hours: pmHours, semester: currentSemester });
        }
      }

      parsedMembers.push({
        memberName,
        semester1Hours,
        semester2Hours,
        totalHours: semester1Hours + semester2Hours,
        dailyDetails,
        additionalHourDetails: [],
      });
    }

    if(parsedMembers.length === 0 && dailyDateSlotsInfo.length > 0){
         console.warn("No member data found starting from Excel Row 5 on 'HourTracker' sheet, or data parsing failed for members.");
    }
    finalParsedData.aggregatedHeaders = aggregatedTableHeaders;
    finalParsedData.members = parsedMembers;


    // --- Parse "Additional Hours" Sheet (Sheet 2, index 1) ---
    if (workbook.SheetNames.length < 2) {
      console.warn("Second sheet 'AdditionalHours' not found. Additional hours will not be processed.");
    } else {
      const additionalHoursSheetName = workbook.SheetNames[1];
      const additionalHoursWorksheet = workbook.Sheets[additionalHoursSheetName];
      const additionalHoursAOA: any[][] = XLSX.utils.sheet_to_json(additionalHoursWorksheet, { header: 1, defval: "" });

      if (!finalParsedData.sem1StartDate) {
        console.error("Semester 1 Start Date is not available; cannot process additional hours accurately.");
      } else {
        // Member names start from Excel Row 5 (index 4 in additionalHoursAOA)
        for (let i = 4; i < additionalHoursAOA.length; i++) {
          const row = additionalHoursAOA[i];
          const memberName = row[0]?.toString().trim();
          if (!memberName) continue;

          let memberToUpdate = finalParsedData.members!.find(m => m.memberName === memberName);
          if (!memberToUpdate) {
            // If member not found in HourTracker, create a new entry.
            // This case might imply data inconsistency or members only having additional hours.
            console.warn(`Member "${memberName}" from "AdditionalHours" sheet not found in "HourTracker" sheet. Creating new entry.`);
            memberToUpdate = {
              memberName,
              semester1Hours: 0,
              semester2Hours: 0,
              totalHours: 0,
              dailyDetails: [],
              additionalHourDetails: [],
            };
            finalParsedData.members!.push(memberToUpdate);
          }

          // Iterate through sets of (Date, Hours, Notes) columns horizontally
          for (let colOffset = 0; (1 + colOffset) < row.length; colOffset += 3) {
            const dateColIndex = 1 + colOffset;
            const hoursColIndex = 2 + colOffset;
            const notesColIndex = 3 + colOffset;

            const additionalDateRaw = row[dateColIndex];
            if (!additionalDateRaw || String(additionalDateRaw).trim() === "") {
              // No date in this set, so assume no more entries for this member in this row
              break; 
            }

            const hoursRaw = (hoursColIndex < row.length) ? row[hoursColIndex]?.toString().trim() : "";
            const notes = (notesColIndex < row.length) ? row[notesColIndex]?.toString().trim() : '';
            
            let additionalHours = 0;
            if (hoursRaw && hoursRaw !== "") {
              const parsedNum = parseFloat(hoursRaw);
              if (!isNaN(parsedNum)) {
                additionalHours = parsedNum;
              } else {
                console.warn(`Invalid hour value '${hoursRaw}' for member '${memberName}' on date '${formatDateStandard(parseExcelDate(additionalDateRaw)) || 'unknown date'}'. Treating as 0 additional hours.`);
              }
            }

            if (additionalHours <= 0) {
              continue; // Skip if no hours
            }

            const additionalJsDate = parseExcelDate(additionalDateRaw);
            if (additionalJsDate && finalParsedData.sem1StartDate) {
              let semester: 1 | 2;
              if (finalParsedData.sem2StartDate && additionalJsDate >= finalParsedData.sem2StartDate) {
                semester = 2;
                if (finalParsedData.sem2EndDate && additionalJsDate >= finalParsedData.sem2EndDate) {
                  continue; // Entry is after S2 ends
                }
                memberToUpdate.semester2Hours += additionalHours;
              } else if (additionalJsDate >= finalParsedData.sem1StartDate) {
                semester = 1;
                memberToUpdate.semester1Hours += additionalHours;
              } else {
                continue; // Entry is before S1 starts
              }

              memberToUpdate.totalHours += additionalHours;
              memberToUpdate.additionalHourDetails.push({
                date: formatDateStandard(additionalJsDate),
                hours: additionalHours,
                notes: notes,
                semester: semester
              });
            } else {
                console.warn(`Invalid date value '${additionalDateRaw}' or missing Sem 1 start date for member '${memberName}' in 'AdditionalHours' sheet (Row ${i + 1}, Date Col ${dateColIndex +1}). Skipping this additional hour entry.`);
            }
          }
        }
      }
    }

    // --- Parse "Officers" Sheet (Sheet 4, index 3) ---
    const officerDetails: OfficerInfo[] = [];
    if (workbook.SheetNames.length < 4) {
       console.warn("Fourth sheet 'Officers' not found. Officer details will be unavailable.");
    } else {
      const officerSheetName = workbook.SheetNames[3];
      const officerWorksheet = workbook.Sheets[officerSheetName];
      const officerAOA: any[][] = XLSX.utils.sheet_to_json(officerWorksheet, { header: 1, defval: "" });

      for (let i = 2; i < officerAOA.length; i++) {
        const row = officerAOA[i];
        const name = row[0]?.toString().trim() || '';

        if (name) {
          const role = row[1]?.toString().trim() || 'NHS Officer';
          const email = row[2]?.toString().trim() || '';
          const description = row[3]?.toString().trim() || 'No description provided.';

          let primaryBase64Text = row[4]?.toString().trim() || '';
          let primaryColIndex = 5;
          while (primaryColIndex < row.length && row[primaryColIndex]?.toString().trim()) {
            primaryBase64Text += row[primaryColIndex].toString().trim();
            primaryColIndex++;
          }

          let finalPrimaryImageBase64 = TRANSPARENT_PIXEL;
          if (primaryBase64Text) {
            if (primaryBase64Text.startsWith('data:image')) {
              finalPrimaryImageBase64 = primaryBase64Text;
            } else {
              finalPrimaryImageBase64 = `data:image/png;base64,${primaryBase64Text}`;
            }
          }

          let finalSecondaryImageBase64: string | null = null;
          const secondaryRowDataIndex = i + 23;

          if (secondaryRowDataIndex < officerAOA.length) {
            const secondaryImageRow = officerAOA[secondaryRowDataIndex];
            if (secondaryImageRow && secondaryImageRow.length > 4) {
              let secondaryBase64Text = secondaryImageRow[4]?.toString().trim() || '';
              let secondaryColIdx = 5;
              while (secondaryColIdx < secondaryImageRow.length && secondaryImageRow[secondaryColIdx]?.toString().trim()) {
                secondaryBase64Text += secondaryImageRow[secondaryColIdx].toString().trim();
                secondaryColIdx++;
              }
              if (secondaryBase64Text) {
                if (secondaryBase64Text.startsWith('data:image')) {
                  finalSecondaryImageBase64 = secondaryBase64Text;
                } else {
                  finalSecondaryImageBase64 = `data:image/png;base64,${secondaryBase64Text}`;
                }
              }
            }
          }

          officerDetails.push({
            id: `officer-${i}`,
            name: name,
            role: role,
            email: email,
            description: description,
            imageBase64: finalPrimaryImageBase64,
            secondaryImageBase64: finalSecondaryImageBase64 || null,
          });
        }
      }
    }
    finalParsedData.officerDetails = officerDetails.length > 0 ? officerDetails : null;


    // --- Parse "Subjects" Sheet (Sheet 6, index 5) ---
    const parsedSubjectsData: SubjectDetails[] = [];
    if (workbook.SheetNames.length < 6) {
      console.warn("Sixth sheet 'Subjects' not found. Subject/Course data will be unavailable for Member Details and Study Resources.");
    } else {
      const subjectsSheetName = workbook.SheetNames[5];
      const subjectsWorksheet = workbook.Sheets[subjectsSheetName];
      const subjectsAOA: any[][] = XLSX.utils.sheet_to_json(subjectsWorksheet, { header: 1, defval: "" });

      for (let i = 1; i < subjectsAOA.length; i++) {
        const row = subjectsAOA[i];
        const subjectName = row[16]?.toString().trim();
        const courseStartCellRef = row[17]?.toString().trim();
        const courseEndCellRef = row[18]?.toString().trim();
        const subjectColorRaw = row[19]?.toString().trim();

        if (!subjectName || !courseStartCellRef || !courseEndCellRef) {
          console.warn(`Skipping subject in "Subjects" sheet row ${i + 1} due to missing name or course cell refs.`);
          continue;
        }

        const subjectId = createIdFromName(subjectName);
        const subjectColor = validateAndFormatHex(subjectColorRaw, DEFAULT_SUBJECT_COLOR, `Subject: ${subjectName}`);

        const courses: CourseDetail[] = [];
        const courseNameMap = new Map<string, CourseDetail>();

        try {
          const startCell = XLSX.utils.decode_cell(courseStartCellRef);
          const endCell = XLSX.utils.decode_cell(courseEndCellRef);

          if (startCell.c !== endCell.c) {
            console.warn(`Courses for subject '${subjectName}' are expected in a single column. Start/End cells: ${courseStartCellRef}/${courseEndCellRef}. Skipping courses.`);
          } else {
            const courseCol = startCell.c;
            const colorCol = courseCol + 1;

            for (let r = startCell.r; r <= endCell.r; r++) {
              const courseNameCellAddress = XLSX.utils.encode_cell({c: courseCol, r: r});
              const courseColorCellAddress = XLSX.utils.encode_cell({c: colorCol, r: r});

              const courseNameRaw = subjectsWorksheet[courseNameCellAddress]?.v;
              const courseColorRawVal = subjectsWorksheet[courseColorCellAddress]?.v;

              const courseName = courseNameRaw?.toString().trim();
              const courseColorString = courseColorRawVal?.toString().trim();

              if (courseName) {
                const courseHexColor = validateAndFormatHex(courseColorString, DEFAULT_COURSE_COLOR, `Course: ${courseName} for Subject: ${subjectName}`);
                const courseDetail: CourseDetail = { name: courseName, color: courseHexColor };
                courses.push(courseDetail);
                courseNameMap.set(courseName.toLowerCase(), courseDetail);
              }
            }
          }
        } catch (cellRefError) {
          console.warn(`Error parsing cell references for subject '${subjectName}' in "Subjects" sheet: ${cellRefError}. Skipping courses for this subject.`);
        }
        parsedSubjectsData.push({ id: subjectId, name: subjectName, color: subjectColor, courses, courseNameMap });
      }
    }
    finalParsedData.subjectsData = parsedSubjectsData.length > 0 ? parsedSubjectsData : null;

    // --- Parse "MemberDetails" Sheet (Sheet 5, index 4) ---
    const memberProficienciesOutput: MemberProficiencyInfo[] = [];
    if (workbook.SheetNames.length < 5) {
      console.warn("Fifth sheet 'MemberDetails' not found. Member proficiency details will be unavailable.");
    } else {
      const memberDetailsSheetName = workbook.SheetNames[4];
      const memberDetailsWorksheet = workbook.Sheets[memberDetailsSheetName];
      const memberDetailsAOA: any[][] = XLSX.utils.sheet_to_json(memberDetailsWorksheet, { header: 1, defval: "" });

      if (memberDetailsAOA.length < 6) {
        console.warn("'MemberDetails' sheet (Sheet 5) has too few rows for member data (expected member data from Row 6).");
      } else {
        for (let rowIdx = 5; rowIdx < memberDetailsAOA.length; rowIdx++) {
          const memberRowData = memberDetailsAOA[rowIdx];
          const memberName = memberRowData[0]?.toString().trim();
          if (!memberName) continue;

          const proficienciesBySubjectMap = new Map<string, MemberProficiencyInSubject>();

          for (let courseColIdx = 1; courseColIdx < memberRowData.length; courseColIdx++) {
            const proficientCourseName = memberRowData[courseColIdx]?.toString().trim();
            if (!proficientCourseName) continue;

            let courseFoundInAnySubject = false;
            if (finalParsedData.subjectsData) {
              for (const subject of finalParsedData.subjectsData) {
                const courseDetail = subject.courseNameMap.get(proficientCourseName.toLowerCase());
                if (courseDetail) {
                  let subjectProficiencyEntry = proficienciesBySubjectMap.get(subject.id);
                  if (!subjectProficiencyEntry) {
                    subjectProficiencyEntry = {
                      subjectId: subject.id,
                      subjectName: subject.name,
                      subjectColor: subject.color,
                      proficientCoursesInSubject: [],
                      count: 0,
                    };
                    proficienciesBySubjectMap.set(subject.id, subjectProficiencyEntry);
                  }
                  if (!subjectProficiencyEntry.proficientCoursesInSubject.find(c => c.name === courseDetail.name)) {
                      subjectProficiencyEntry.proficientCoursesInSubject.push(courseDetail);
                      subjectProficiencyEntry.count++;
                  }
                  courseFoundInAnySubject = true;
                  break;
                }
              }
            }
            if (!courseFoundInAnySubject) {
              console.warn(
                `[Spreadsheet Parser Warning - MemberDetails Sheet 5, Row ${rowIdx + 1}, Col ${String.fromCharCode(65 + courseColIdx)}]: ` +
                `Proficient course "${proficientCourseName}" listed for member "${memberName}" was not found (case-insensitively) in any subject's course list in the "Subjects" sheet (Sheet 6). ` +
                `This proficiency entry will be ignored.`
              );
            }
          }

          memberProficienciesOutput.push({
            id: `memberProf-${rowIdx}`,
            name: memberName,
            proficienciesBySubject: Array.from(proficienciesBySubjectMap.values()),
          });
        }
      }
    }
    finalParsedData.memberProficiencies = memberProficienciesOutput.length > 0 ? memberProficienciesOutput : null;

    // --- Parse "StudyResources" Sheet (Sheet 7, index 6) ---
    const studyResources: StudyResource[] = [];
    const availableGeneralTags: GeneralTag[] = [];
    const availableGeneralTagsMap = new Map<string, GeneralTag>(); // For quick lookup

    if (workbook.SheetNames.length < 7) {
      console.warn("Seventh sheet 'StudyResources' not found. Study Resources page will be empty.");
    } else {
      const studyResourcesSheetName = workbook.SheetNames[6];
      const studyResourcesWorksheet = workbook.Sheets[studyResourcesSheetName];
      const studyResourcesAOA: any[][] = XLSX.utils.sheet_to_json(studyResourcesWorksheet, { header: 1, defval: "" });

      // Parse available general tags from Row 1
      if (studyResourcesAOA.length > 0) {
        const generalTagsRow = studyResourcesAOA[0];
        for (let colIdx = 1; colIdx < generalTagsRow.length; colIdx++) { // Start from Col B
          const tagName = generalTagsRow[colIdx]?.toString().trim();
          if (tagName) {
            const tagId = createIdFromName(tagName);
            const generalTag: GeneralTag = { id: tagId, name: tagName };
            if (!availableGeneralTagsMap.has(tagId)) {
              availableGeneralTags.push(generalTag);
              availableGeneralTagsMap.set(tagId, generalTag);
            }
          }
        }
      }
      finalParsedData.availableGeneralTags = availableGeneralTags.length > 0 ? availableGeneralTags : null;

      // Parse study resource entries from Row 4 onwards
      if (studyResourcesAOA.length >= 4) {
        for (let rowIdx = 3; rowIdx < studyResourcesAOA.length; rowIdx++) { // Excel Row 4 is index 3
          const row = studyResourcesAOA[rowIdx];
          const resourceName = row[1]?.toString().trim(); // Col B
          if (!resourceName) continue; // Skip if no resource name

          const description = row[2]?.toString().trim() || "No description provided."; // Col C
          const subjectTagNames = (row[3]?.toString() || '').split(',').map(t => t.trim()).filter(Boolean); // Col D
          const courseTagNames = (row[4]?.toString() || '').split(',').map(t => t.trim()).filter(Boolean); // Col E
          const downloadLink = row[5]?.toString().trim() || null; // Col F
          const generalTagsString = row[6]?.toString().trim(); // Col G

          const matchedSubjects: ResourceSubject[] = [];
          const matchedCourses: ResourceCourse[] = [];
          const addedSubjectIds = new Set<string>();

          // Process explicit subject tags first
          if (subjectTagNames.length > 0 && finalParsedData.subjectsData) {
            for (const tagName of subjectTagNames) {
              const matchedSubject = finalParsedData.subjectsData.find(s => s.name.toLowerCase() === tagName.toLowerCase());
              if (matchedSubject && !addedSubjectIds.has(matchedSubject.id)) {
                matchedSubjects.push({ id: matchedSubject.id, name: matchedSubject.name, color: matchedSubject.color });
                addedSubjectIds.add(matchedSubject.id);
              } else if (!matchedSubject) {
                console.warn(`Study Resource "${resourceName}": Subject tag "${tagName}" not found.`);
              }
            }
          }

          // Process course tags and implicitly add their subjects
          if (courseTagNames.length > 0 && finalParsedData.subjectsData) {
            for (const courseName of courseTagNames) {
              let courseFound = false;
              for (const subject of finalParsedData.subjectsData) {
                const matchedCourse = subject.courseNameMap.get(courseName.toLowerCase());
                if (matchedCourse) {
                  // Add the matched course
                  matchedCourses.push({ name: matchedCourse.name, color: matchedCourse.color, subjectId: subject.id });
                  
                  // Add the course's subject if it wasn't already added explicitly
                  if (!addedSubjectIds.has(subject.id)) {
                    matchedSubjects.push({ id: subject.id, name: subject.name, color: subject.color });
                    addedSubjectIds.add(subject.id);
                  }
                  
                  courseFound = true;
                  break; // Assume course names are unique across subjects, stop after first find.
                }
              }
              if (!courseFound) {
                console.warn(`Study Resource "${resourceName}": Course tag "${courseName}" not found in any subject.`);
              }
            }
          }

          const resourceGeneralTags: GeneralTag[] = [];
          if (generalTagsString && availableGeneralTags.length > 0) {
            const tagNamesFromSheet = generalTagsString.split(',').map(t => t.trim().toLowerCase());
            tagNamesFromSheet.forEach(tagNameFromSheet => {
              const matchedTag = availableGeneralTags.find(gt => gt.name.toLowerCase() === tagNameFromSheet);
              if (matchedTag) {
                resourceGeneralTags.push(matchedTag);
              } else if (tagNameFromSheet) {
                 console.warn(`Study Resource "${resourceName}": General tag "${tagNameFromSheet}" is not in the defined list of general tags (Row 1 of StudyResources sheet).`);
              }
            });
          }

          studyResources.push({
            id: `resource-${rowIdx}`,
            name: resourceName,
            description,
            downloadLink,
            generalTags: resourceGeneralTags,
            matchedSubjects,
            matchedCourses,
          });
        }
      }
    }
    finalParsedData.studyResources = studyResources.length > 0 ? studyResources : null;

    // --- Parse "MeetingInfo" Sheet (Sheet 8, index 7) ---
    const meetingInfoList: MeetingInfoItem[] = [];
    if (workbook.SheetNames.length < 8) {
      console.warn("Eighth sheet 'MeetingInfo' not found. Meeting Information page will be empty.");
    } else {
      const meetingInfoSheetName = workbook.SheetNames[7];
      const meetingInfoWorksheet = workbook.Sheets[meetingInfoSheetName];
      const meetingInfoAOA: any[][] = XLSX.utils.sheet_to_json(meetingInfoWorksheet, { header: 1, defval: "" });

      if (meetingInfoAOA.length < 4) {
        console.warn("'MeetingInfo' sheet (Sheet 8) has too few rows for meeting data (expected data from Row 4).");
      } else {
        for (let rowIdx = 3; rowIdx < meetingInfoAOA.length; rowIdx++) { // Excel Row 4 is index 3
          const row = meetingInfoAOA[rowIdx];
          const title = row[1]?.toString().trim(); // Col B
          if (!title) continue; // Skip if no title

          const dateRaw = row[2]; // Col C
          const startTimeRaw = row[3]; // Col D
          const endTimeRaw = row[4]; // Col E
          const length = row[5]?.toString().trim() || "N/A"; // Col F - NEW
          const notes = row[6]?.toString().trim() || "No notes for this meeting."; // Col G

          const parsedDate = parseExcelDate(dateRaw);

          meetingInfoList.push({
            id: `meeting-${rowIdx}`,
            title,
            date: parsedDate ? formatDateForHomePage(parsedDate) || "Invalid Date" : "Invalid Date",
            rawDate: parsedDate,
            startTime: formatExcelTime(startTimeRaw, date1904),
            endTime: formatExcelTime(endTimeRaw, date1904),
            length: length, // Store length
            notes,
          });
        }
      }
    }
    finalParsedData.meetingInfo = meetingInfoList.length > 0 ? meetingInfoList : null;


    return finalParsedData as DetailedHoursData;

  } catch (err) {
    console.error("Error parsing spreadsheet:", err);
    if (err instanceof Error && (err.message.includes("SheetNames") || err.message.includes("not found"))){
         throw new Error("A required sheet ('HourTracker', 'AdditionalHours', 'Information', 'Officers', 'MemberDetails', 'Subjects', 'StudyResources', or 'MeetingInfo') might be missing or sheets are out of order in NHSExcel.xlsx. Please check sheet names and order.");
    }
    throw err;
  }
};