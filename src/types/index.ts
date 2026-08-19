/* ---- Types for Clinical Rotation Scheduler ---- */

export interface Student {
  id: string;
  name: string;
  sortOrder: number;
}

export interface Station {
  id: string;
  name: string;
  sortOrder: number;
}

export interface ScheduleWeek {
  start: string; // "YYYY-MM-DD"
  end: string; // "YYYY-MM-DD"
  label: string; // "20-24 ต.ค."
}

export interface ScheduleColumn {
  weeks: (ScheduleWeek & { weekIndex: number })[];
}

export interface ScheduleResult {
  columns: ScheduleColumn[];
  grid: string[][]; // grid[studentIdx][colIdx] = station name
  stationIndices: number[][]; // grid[studentIdx][colIdx] = station color index
  totalWeeks: number;
  startDate: string;
  endDate: string;
}

export interface GenerateParams {
  students: Student[];
  stations: Station[];
  startDate: Date;
  endDate: Date;
}

export type TabId = 'schedule' | 'students' | 'stations';

export interface TabItem {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: TabItem[] = [
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'students', label: 'Students', icon: '👥' },
  { id: 'stations', label: 'Stations', icon: '🏥' },
];

export const STORAGE_KEYS = {
  students: 'rotation_students',
  stations: 'rotation_stations',
} as const;
