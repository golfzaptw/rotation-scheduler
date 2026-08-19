import { addDays, format, getDay, startOfWeek, isSameDay } from 'date-fns';
import { th } from 'date-fns/locale'; // Make sure date-fns is v3 or v4 (using import { th })
import type { GenerateParams, ScheduleResult, ScheduleWeek } from '../types';

function getWeekLabel(start: Date, end: Date): string {
  const startMonth = format(start, 'MMM', { locale: th });
  const endMonth = format(end, 'MMM', { locale: th });

  if (startMonth === endMonth) {
    return `${format(start, 'd')}-${format(end, 'd')} ${startMonth}`;
  }
  return `${format(start, 'd')} ${startMonth} - ${format(end, 'd')} ${endMonth}`;
}

export function generateSchedule(params: GenerateParams): ScheduleResult {
  const { students, stations, startDate, endDate } = params;

  if (students.length === 0 || stations.length === 0 || startDate > endDate) {
    return { columns: [], grid: [], stationIndices: [], totalWeeks: 0, startDate: '', endDate: '' };
  }

  // Sort by sortOrder
  const sortedStudents = [...students].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedStations = [...stations].sort((a, b) => a.sortOrder - b.sortOrder);

  const S = sortedStations.length;

  // 1. Collect all weeks up to endDate
  const allWeeks = [];
  
  // Find the Monday of the starting week
  let currentMonday = startOfWeek(new Date(startDate), { weekStartsOn: 1 });
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  while (currentMonday <= end) {
    const monday = currentMonday;
    const friday = addDays(monday, 4);

    allWeeks.push({
      start: format(monday, 'yyyy-MM-dd'),
      end: format(friday, 'yyyy-MM-dd'),
      label: getWeekLabel(monday, friday),
    });

    currentMonday = addDays(currentMonday, 7);
  }

  const totalWeeks = allWeeks.length;
  const numColumns = Math.min(totalWeeks, S);

  // 2. Build columns (distributing weeks using modulo arithmetic)
  const columns = Array.from({ length: numColumns }, () => ({ weeks: [] })) as any;
  for (let w = 0; w < totalWeeks; w++) {
    const colIdx = w % S;
    columns[colIdx].weeks.push({
      weekIndex: w,
      ...allWeeks[w]
    });
  }

  // 3. Build grid (iterate up to numColumns only)
  const grid: string[][] = [];
  const stationIndices: number[][] = [];

  for (let i = 0; i < sortedStudents.length; i++) {
    const row: string[] = [];
    const indexRow: number[] = [];
    for (let c = 0; c < numColumns; c++) {
      const stationIdx = (i + c) % S;
      row.push(sortedStations[stationIdx].name);
      indexRow.push(stationIdx);
    }
    grid.push(row);
    stationIndices.push(indexRow);
  }

  const scheduleStart = allWeeks.length > 0 ? allWeeks[0].start : '';
  const scheduleEnd = allWeeks.length > 0 ? allWeeks[allWeeks.length - 1].end : '';

  return { columns, grid, stationIndices, totalWeeks, startDate: scheduleStart, endDate: scheduleEnd };
}
