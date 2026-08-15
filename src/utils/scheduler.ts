import { addDays, format, getDay } from 'date-fns';
import type { GenerateParams, ScheduleResult } from '../types';

/**
 * Generate a round-robin cascading clinical rotation schedule.
 *
 * Algorithm:
 * 1. Collect `numWorkingDays` dates starting from `startDate`,
 *    skipping weekends (Sat/Sun) and custom holidays.
 * 2. For each working day index `d` and student index `i`:
 *    stationIndex = (i + d) % numStations
 *
 * This produces the cascading pattern where each student
 * advances to the next station every working day.
 */
export function generateSchedule(params: GenerateParams): ScheduleResult {
  const { students, stations, holidays, startDate, numWorkingDays } = params;

  if (students.length === 0 || stations.length === 0 || numWorkingDays <= 0) {
    return { workingDays: [], grid: [], stationIndices: [] };
  }

  // Sort by sortOrder
  const sortedStudents = [...students].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedStations = [...stations].sort((a, b) => a.sortOrder - b.sortOrder);

  const S = sortedStations.length;

  // 1. Collect working days
  const workingDays: string[] = [];
  let cursor = new Date(startDate);

  // Safety limit to prevent infinite loops
  const MAX_ITERATIONS = numWorkingDays * 5;
  let iterations = 0;

  while (workingDays.length < numWorkingDays && iterations < MAX_ITERATIONS) {
    const dow = getDay(cursor); // 0 = Sunday, 6 = Saturday
    const dateStr = format(cursor, 'yyyy-MM-dd');

    if (dow !== 0 && dow !== 6 && !holidays.has(dateStr)) {
      workingDays.push(dateStr);
    }

    cursor = addDays(cursor, 1);
    iterations++;
  }

  // 2. Build grid with round-robin cascade
  const grid: string[][] = [];
  const stationIndices: number[][] = [];

  for (let i = 0; i < sortedStudents.length; i++) {
    const row: string[] = [];
    const indexRow: number[] = [];
    for (let d = 0; d < workingDays.length; d++) {
      const stationIdx = (i + d) % S;
      row.push(sortedStations[stationIdx].name);
      indexRow.push(stationIdx);
    }
    grid.push(row);
    stationIndices.push(indexRow);
  }

  return { workingDays, grid, stationIndices };
}
