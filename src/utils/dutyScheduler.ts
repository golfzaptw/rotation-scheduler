import { addDays, format, getDay, startOfWeek } from 'date-fns';
import type { Student, DutyDay, DutyStats, DutyScheduleResult } from '../types';

const STUDENTS_PER_DAY = 3;
const HOLIDAYS = new Set(['12-30', '12-31', '01-01', '04-12', '04-13', '04-14', '04-15']);

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isHoliday(dateStr: string): boolean {
  const mmdd = dateStr.slice(5, 10);
  return HOLIDAYS.has(mmdd);
}

export function generateDutySchedule(
  students: Student[],
  startDate: Date,
  endDate: Date,
): DutyScheduleResult {
  const sortedStudents = [...students].sort((a, b) => a.sortOrder - b.sortOrder);
  const names = sortedStudents.map((s) => s.name);
  const n = names.length;

  if (n < STUDENTS_PER_DAY) {
    return { days: [], stats: [], startDate: '', endDate: '' };
  }

  // Build list of all days in range
  const allDays: { date: string; dayOfWeek: number; weekend: boolean; holiday: boolean }[] = [];
  let cursor = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (cursor <= end) {
    const dow = getDay(cursor);
    const dateStr = format(cursor, 'yyyy-MM-dd');
    allDays.push({
      date: dateStr,
      dayOfWeek: dow,
      weekend: isWeekend(dow),
      holiday: isHoliday(dateStr),
    });
    cursor = addDays(cursor, 1);
  }

  if (allDays.length === 0) {
    return { days: [], stats: [], startDate: '', endDate: '' };
  }

  // Counters
  const totalCount = new Map<string, number>();
  const holidayCount = new Map<string, number>();
  const dayCount: Map<string, number>[] = Array.from({ length: 7 }, () => new Map());
  for (const name of names) {
    totalCount.set(name, 0);
    holidayCount.set(name, 0);
    for (let d = 0; d < 7; d++) dayCount[d].set(name, 0);
  }

  // Group days into weeks (Mon-Sun)
  const weeks: typeof allDays[] = [];
  let currentWeekStart = startOfWeek(new Date(allDays[0].date), { weekStartsOn: 1 });
  let currentWeek: typeof allDays = [];

  for (const day of allDays) {
    const dayWeekStart = startOfWeek(new Date(day.date), { weekStartsOn: 1 });
    if (dayWeekStart.getTime() !== currentWeekStart.getTime()) {
      if (currentWeek.length > 0) weeks.push(currentWeek);
      currentWeek = [];
      currentWeekStart = dayWeekStart;
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Keep track of assignments by date string to check adjacent days
  const assignedByDate = new Map<string, Set<string>>();
  for (const day of allDays) {
    assignedByDate.set(day.date, new Set<string>());
  }
  const warnings = new Set<string>();

  // Assign duties week by week
  const result: DutyDay[] = [];

  for (const week of weeks) {
    const usedThisWeek = new Set<string>();

    // Shuffle the days in the week so the "leftover" students aren't always
    // forced into Friday/Saturday/Sunday, which caused huge variance on specific days.
    // We also process HOLIDAYS FIRST so they get the full pool of unused candidates!
    const shuffledWeek = [...week].sort((a, b) => {
      if (a.holiday && !b.holiday) return -1;
      if (!a.holiday && b.holiday) return 1;
      return Math.random() - 0.5;
    });

    for (const day of shuffledWeek) {
      const dow = day.dayOfWeek;
      const dowCounter = dayCount[dow];

      const yesterdayStr = format(addDays(new Date(day.date), -1), 'yyyy-MM-dd');
      const tomorrowStr = format(addDays(new Date(day.date), 1), 'yyyy-MM-dd');
      const assignedYesterday = assignedByDate.get(yesterdayStr) || new Set<string>();
      const assignedTomorrow = assignedByDate.get(tomorrowStr) || new Set<string>();

      const isAdjacent = (name: string) => assignedYesterday.has(name) || assignedTomorrow.has(name);

      // Candidates: not used this week yet
      let candidates = names.filter((name) => !usedThisWeek.has(name));

      // Try to filter out adjacent to avoid consecutive shifts
      let nonAdjacentCandidates = candidates.filter((name) => !isAdjacent(name));

      if (nonAdjacentCandidates.length >= STUDENTS_PER_DAY) {
        candidates = nonAdjacentCandidates;
      }

      // ponytail: if pool exhausted, allow reuse
      if (candidates.length < STUDENTS_PER_DAY) {
        let fallbackCandidates = [...names];
        let fallbackNonAdjacent = fallbackCandidates.filter((name) => !isAdjacent(name));
        if (fallbackNonAdjacent.length >= STUDENTS_PER_DAY) {
          candidates = fallbackNonAdjacent;
        } else {
          candidates = fallbackCandidates;
        }
      }

      // Sort priority:
      //   0. Adjacent status (penalize those who are adjacent if we had to fallback to them)
      //   1. If holiday -> Holiday count (ascending) to guarantee 1 shift per person
      //   2. Total count (ascending) — ensures total spread ≤ 1
      //   3. This specific day's count (ascending) — balances ALL days evenly
      //   4. Random tiebreak
      candidates.sort((a, b) => {
        const aAdj = isAdjacent(a) ? 1 : 0;
        const bAdj = isAdjacent(b) ? 1 : 0;
        if (aAdj !== bAdj) return aAdj - bAdj;

        if (day.holiday) {
          const hDiff = (holidayCount.get(a) ?? 0) - (holidayCount.get(b) ?? 0);
          if (hDiff !== 0) return hDiff;
        }

        const totalDiff = (totalCount.get(a) ?? 0) - (totalCount.get(b) ?? 0);
        if (totalDiff !== 0) return totalDiff;

        const dowDiff = (dowCounter.get(a) ?? 0) - (dowCounter.get(b) ?? 0);
        if (dowDiff !== 0) return dowDiff;

        return Math.random() - 0.5;
      });

      const assigned = candidates.slice(0, STUDENTS_PER_DAY);
      const todaySet = assignedByDate.get(day.date)!;

      for (const name of assigned) {
        usedThisWeek.add(name);
        todaySet.add(name);
        totalCount.set(name, (totalCount.get(name) ?? 0) + 1);
        dowCounter.set(name, (dowCounter.get(name) ?? 0) + 1);
        if (day.holiday) holidayCount.set(name, (holidayCount.get(name) ?? 0) + 1);

        if (assignedYesterday.has(name)) {
          warnings.add(`มีการขึ้นเวรติดกัน: ${name} (${yesterdayStr} และ ${day.date})`);
        }
        if (assignedTomorrow.has(name)) {
          warnings.add(`มีการขึ้นเวรติดกัน: ${name} (${day.date} และ ${tomorrowStr})`);
        }
      }

      result.push({
        date: day.date,
        dayOfWeek: dow,
        isWeekend: day.weekend,
        assignedStudents: assigned,
      });
    }
  }

  // Restore chronological order (since we processed days out-of-order)
  result.sort((a, b) => a.date.localeCompare(b.date));

  // Build stats
  const stats: DutyStats[] = names.map((name) => {
    const perDay = [0, 1, 2, 3, 4, 5, 6].map((d) => dayCount[d].get(name) ?? 0) as DutyStats['perDay'];
    return {
      studentName: name,
      perDay,
      totalCount: totalCount.get(name) ?? 0,
    };
  });

  return {
    days: result,
    stats,
    startDate: allDays[0].date,
    endDate: allDays[allDays.length - 1].date,
  };
}

