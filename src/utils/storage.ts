import { STORAGE_KEYS, type Student, type Station } from '../types';

/* ---- Generic localStorage helpers ---- */

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save to localStorage key "${key}":`, e);
  }
}

/* ---- Default seeds ---- */

const DEFAULT_STUDENTS: Student[] = [
  'อัฐภิญญา', 'ศยามล', 'ปุญชรัสมิ์', 'สุธารินี', 'เพราผกา', 'ปียาภรณ์', 'นฤดี',
  'อาทิตย์', 'พนิดา', 'พรพิมล', 'เจนจิรา', 'นรมน', 'วิบูลย์ศิริ', 'ลักษณนันทมน',
  'สุพิชญ์ชา', 'สิริรัตน์', 'วรเมธ', 'นนทวัฒน์', 'กรรณิกา', 'กาญจนา', 'ชญาดา',
  'ธีรภัทร์', 'เบญญาภา', 'ปนิฏฐา', 'พรสวรรค์', 'ริยาภรณ์', 'สุพรรณี', 'สกาวใจ'
].map((name, index) => ({ id: crypto.randomUUID(), name, sortOrder: index }));

const DEFAULT_STATIONS: Station[] = [
  'PACU ศัลย์ ชั้น 7',
  'Outside',
  'TR2',
  'LR1',
  'OPD ศัลย์ 7-1',
  'F1',
  'ENT4',
  'PACU อบ.',
  'E1',
  'ENT6',
  'EYE8',
  'LR3',
  'PNB',
  'F2',
  'TR3',
  'PACU LR',
  'OPD ศัลย์ 7-2',
  'OR อบ.1',
  'R36',
  'ENT5',
  'LR2',
  'F3',
  'PACU สก 1',
  'OR อบ.2',
  'PACU สก 2',
  'C/S',
  'GI',
  'EYE7'
].map((name, index) => ({ id: crypto.randomUUID(), name, sortOrder: index }));

export function loadStudents(): Student[] {
  const stored = loadFromStorage<Student[] | null>(STORAGE_KEYS.students, null);
  if (stored === null || stored.length === 0) {
    saveToStorage(STORAGE_KEYS.students, DEFAULT_STUDENTS);
    return DEFAULT_STUDENTS;
  }
  return stored;
}

export function saveStudents(students: Student[]): void {
  saveToStorage(STORAGE_KEYS.students, students);
}

export function loadStations(): Station[] {
  const stored = loadFromStorage<Station[] | null>(STORAGE_KEYS.stations, null);
  if (stored === null || stored.length === 0) {
    // Seed defaults on first load
    saveToStorage(STORAGE_KEYS.stations, DEFAULT_STATIONS);
    return DEFAULT_STATIONS;
  }
  return stored;
}

export function saveStations(stations: Station[]): void {
  saveToStorage(STORAGE_KEYS.stations, stations);
}
