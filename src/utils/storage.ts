import { STORAGE_KEYS, type Student, type Station } from "../types";

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
  "นร.ลักษณนันทมน",
  "นร.สุพิชญ์ชา",
  "นร.สิริรัตน์",
  "นร.เจนจิรา",
  "นร.วรเมธ",
  "นร.นนทวัฒน์",
  "นร.นรมน",
  "นร.กรรณิกา",
  "นร.กาญจนา",
  "นร.ชญาดา",
  "นร.ธีรภัทร์",
  "นร.เบญญาภา",
  "นร.ปนิฏฐา",
  "นร.พรสวรรค์",
  "นร.ริยาภรณ์",
  "นร.สุพรรณี",
  "นร.สกาวใจ",
  "นร.อัฐภิญญา",
  "นร.ศยามล",
  "นร.ปุญชรัสม์",
  "นร.สุธารินี",
  "นร.เพราผกา",
  "นร.ปิยาภรณ์",
  "นร.นฤดี",
  "นร.อาทิตย์",
  "นร.พนิดา",
  "นร.พรพิมล",
  "นร.วิบูลย์ศิริ",
].map((name, index) => ({ id: crypto.randomUUID(), name, sortOrder: index }));

const DEFAULT_STATIONS: Station[] = [
  "1",
  "37",
  "6",
  "F1",
  "12",
  "Pain",
  "32",
  "2",
  "39",
  "F2",
  "7,8",
  "14",
  "GI",
  "PACU ฉก",
  "5",
  "38",
  "F3",
  "TR2",
  "15",
  "31",
  "PACU สก",
  "9,HB",
  "40",
  "C/S",
  "TR3",
  "PNB",
  "EYE",
  "Outside",
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
