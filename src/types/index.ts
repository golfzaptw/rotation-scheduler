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

export interface Holiday {
  date: string; // "YYYY-MM-DD"
  label: string;
}

export interface ScheduleResult {
  workingDays: string[]; // "YYYY-MM-DD" strings for column headers
  grid: string[][]; // grid[studentIdx][dayIdx] = station name
  stationIndices: number[][]; // grid[studentIdx][dayIdx] = station color index
}

export interface GenerateParams {
  students: Student[];
  stations: Station[];
  holidays: Set<string>;
  startDate: Date;
  numWorkingDays: number;
}

export type TabId = 'schedule' | 'students' | 'stations' | 'holidays';

export interface TabItem {
  id: TabId;
  label: string;
  icon: string;
}

export const TABS: TabItem[] = [
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'students', label: 'Students', icon: '👥' },
  { id: 'stations', label: 'Stations', icon: '🏥' },
  { id: 'holidays', label: 'Holidays', icon: '📆' },
];

export const STORAGE_KEYS = {
  students: 'rotation_students',
  stations: 'rotation_stations',
  holidays: 'rotation_holidays',
} as const;
