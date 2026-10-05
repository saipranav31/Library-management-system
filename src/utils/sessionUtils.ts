import { BookRequest, LibrarySession, User } from '../types';

export interface ISTDateDetails {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hours: number; // 0-23
  minutes: number; // 0-59
  seconds: number; // 0-59
  totalMinutes: number; // minutes from midnight
  time12: string; // e.g. "09:42 AM"
  dateStr: string; // e.g. "2026-10-05"
  displayDate: string; // e.g. "5 Oct 2026"
}

/**
 * Accurately parses a Date in Asia/Kolkata (IST) timezone
 */
export function getISTDetails(date: Date = new Date()): ISTDateDetails {
  // Use Intl.DateTimeFormat with Asia/Kolkata timezone
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  parts.forEach(p => {
    map[p.type] = p.value;
  });

  const year = parseInt(map.year || `${date.getFullYear()}`, 10);
  const month = parseInt(map.month || `${date.getMonth() + 1}`, 10);
  const day = parseInt(map.day || `${date.getDate()}`, 10);
  const hours = parseInt(map.hour || `${date.getHours()}`, 10);
  const minutes = parseInt(map.minute || `${date.getMinutes()}`, 10);
  const seconds = parseInt(map.second || `${date.getSeconds()}`, 10);

  const totalMinutes = hours * 60 + minutes;

  // Format 12-hour time
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  const time12 = `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;

  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const displayDate = `${day} ${monthNames[month - 1]} ${year}`;

  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    totalMinutes,
    time12,
    dateStr,
    displayDate,
  };
}

export interface SessionInfo {
  session: LibrarySession | 'Closed';
  isActive: boolean;
  statusText: string;
  sessionTimeLabel: string;
  closesAtText: string;
  nextSessionText: string;
  rejectionReason?: string;
  remainingMinutes?: number;
}

/**
 * Calculates current library session state according to the rules:
 * - MORNING SESSION: 9:30 AM (570 mins) to 12:30 PM (750 mins)
 * - LUNCH BREAK: 12:30 PM (750 mins) to 1:30 PM (810 mins) -> Closed
 * - AFTERNOON SESSION: 1:30 PM (810 mins) to 4:30 PM (990 mins)
 * - Outside hours:
 *   - Before 9:30 AM (< 570 mins) -> "Morning request session has not started yet."
 *   - After 4:30 PM (>= 990 mins) -> "Today's library request sessions are closed."
 */
export function getLibrarySessionInfo(date: Date = new Date()): SessionInfo {
  const ist = getISTDetails(date);
  const mins = ist.totalMinutes;

  const MORNING_START = 9 * 60 + 30; // 570 = 9:30 AM
  const MORNING_END = 12 * 60 + 30;  // 750 = 12:30 PM
  const AFTERNOON_START = 13 * 60 + 30; // 810 = 1:30 PM
  const AFTERNOON_END = 16 * 60 + 30;  // 990 = 4:30 PM

  if (mins >= MORNING_START && mins < MORNING_END) {
    const remaining = MORNING_END - mins;
    return {
      session: 'Morning',
      isActive: true,
      statusText: 'Morning Session Active',
      sessionTimeLabel: '9:30 AM – 12:30 PM',
      closesAtText: '12:30 PM',
      nextSessionText: 'Closes at 12:30 PM IST',
      remainingMinutes: remaining,
    };
  }

  if (mins >= MORNING_END && mins < AFTERNOON_START) {
    return {
      session: 'Closed',
      isActive: false,
      statusText: 'Library request session is currently closed.',
      sessionTimeLabel: 'Lunch Break / Closed',
      closesAtText: 'Closed',
      nextSessionText: 'Afternoon session starts at 1:30 PM IST',
      rejectionReason: 'Library request session is currently closed.',
    };
  }

  if (mins >= AFTERNOON_START && mins < AFTERNOON_END) {
    const remaining = AFTERNOON_END - mins;
    return {
      session: 'Afternoon',
      isActive: true,
      statusText: 'Afternoon Session Active',
      sessionTimeLabel: '1:30 PM – 4:30 PM',
      closesAtText: '4:30 PM',
      nextSessionText: 'Closes at 4:30 PM IST',
      remainingMinutes: remaining,
    };
  }

  if (mins < MORNING_START) {
    return {
      session: 'Closed',
      isActive: false,
      statusText: 'Morning request session has not started yet.',
      sessionTimeLabel: 'Opens at 9:30 AM',
      closesAtText: 'Closed',
      nextSessionText: 'Morning session opens today at 9:30 AM IST',
      rejectionReason: 'Morning request session has not started yet.',
    };
  }

  // mins >= AFTERNOON_END
  return {
    session: 'Closed',
    isActive: false,
    statusText: "Today's library request sessions are closed.",
    sessionTimeLabel: 'Closed for the day',
    closesAtText: 'Closed',
    nextSessionText: 'Next session opens tomorrow at 9:30 AM IST',
    rejectionReason: "Today's library request sessions are closed.",
  };
}

/**
 * Checks if a granted request has expired according to session rules
 */
export function checkRequestExpired(req: BookRequest, currentDate: Date = new Date()): boolean {
  if (req.status !== 'Granted' && req.status !== 'Approved') {
    return false;
  }

  const currentIST = getISTDetails(currentDate);
  const reqIST = req.requestCreatedAt ? getISTDetails(new Date(req.requestCreatedAt)) : getISTDetails(new Date(req.requestDate));

  // If request is from a previous calendar day, it is definitely expired
  if (currentIST.dateStr > reqIST.dateStr) {
    return true;
  }

  // If from future date (shouldn't happen), not expired
  if (currentIST.dateStr < reqIST.dateStr) {
    return false;
  }

  // On the same day:
  const session = req.session || (reqIST.totalMinutes < 750 ? 'Morning' : 'Afternoon');

  if (session === 'Morning') {
    // Expires strictly at 12:30 PM (750 minutes)
    return currentIST.totalMinutes >= 750;
  }

  if (session === 'Afternoon') {
    // Expires strictly at 4:30 PM (990 minutes)
    return currentIST.totalMinutes >= 990;
  }

  return false;
}

/**
 * Returns academic year string for a given date based on June 1 -> May 31 cycle
 * E.g. Oct 2026 -> "2026-2027", Feb 2027 -> "2026-2027", June 2027 -> "2027-2028"
 */
export function getAcademicYear(date: Date = new Date()): string {
  const ist = getISTDetails(date);
  // Month is 1-12. If month >= 6 (June to Dec), academic year starts in current year
  if (ist.month >= 6) {
    return `${ist.year}-${ist.year + 1}`;
  }
  // If month <= 5 (Jan to May), academic year started in previous year
  return `${ist.year - 1}-${ist.year}`;
}

export interface PromotionResult {
  updatedYearOfStudy: number;
  updatedYearString: string;
  updatedStatus: 'Active' | 'Graduated';
  promoted: boolean;
  graduated: boolean;
}

/**
 * Calculates academic year promotion for a student
 * 1st Year (1) -> 2nd Year (2)
 * 2nd Year (2) -> 3rd Year (3)
 * 3rd Year (3) -> 4th Year (4)
 * 4th Year (4) -> Graduated (NEVER 5th Year!)
 */
export function calculateStudentPromotion(student: User): PromotionResult {
  let currentYearNum = student.yearOfStudy;
  if (!currentYearNum) {
    const yrStr = (student.year || '').toLowerCase();
    if (yrStr.includes('1') || yrStr.includes('first') || yrStr.includes('i ')) currentYearNum = 1;
    else if (yrStr.includes('2') || yrStr.includes('second') || yrStr.includes('ii')) currentYearNum = 2;
    else if (yrStr.includes('3') || yrStr.includes('third') || yrStr.includes('iii')) currentYearNum = 3;
    else if (yrStr.includes('4') || yrStr.includes('fourth') || yrStr.includes('iv')) currentYearNum = 4;
    else if (yrStr.includes('graduat') || yrStr.includes('alumni')) currentYearNum = 0;
    else currentYearNum = 1;
  }

  if (currentYearNum === 0 || student.status === 'Graduated') {
    return {
      updatedYearOfStudy: 0,
      updatedYearString: 'Graduated',
      updatedStatus: 'Graduated',
      promoted: false,
      graduated: true,
    };
  }

  if (currentYearNum >= 4) {
    // 4th Year moves to Graduated! Never 5th Year.
    return {
      updatedYearOfStudy: 0,
      updatedYearString: 'Graduated',
      updatedStatus: 'Graduated',
      promoted: true,
      graduated: true,
    };
  }

  const nextYear = currentYearNum + 1;
  const labels: Record<number, string> = {
    1: '1st Year',
    2: '2nd Year',
    3: '3rd Year',
    4: '4th Year',
  };

  return {
    updatedYearOfStudy: nextYear,
    updatedYearString: labels[nextYear] || `${nextYear}th Year`,
    updatedStatus: 'Active',
    promoted: true,
    graduated: false,
  };
}

/**
 * Formats a timestamp into friendly 12-hour IST time
 */
export function formatISTTime12(dateStringOrDate: string | Date): string {
  const d = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(d.getTime())) return '—';
  return getISTDetails(d).time12;
}

/**
 * Formats a timestamp into friendly IST date and time
 */
export function formatISTDateTime(dateStringOrDate: string | Date): string {
  const d = typeof dateStringOrDate === 'string' ? new Date(dateStringOrDate) : dateStringOrDate;
  if (isNaN(d.getTime())) return '—';
  const ist = getISTDetails(d);
  return `${ist.displayDate}, ${ist.time12}`;
}
