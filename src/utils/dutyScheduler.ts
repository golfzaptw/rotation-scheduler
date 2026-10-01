import { addDays, format, getDay, startOfWeek } from 'date-fns';
import type { Student, DutyDay, DutyStats, DutyScheduleResult } from '../types';

const STUDENTS_PER_DAY = 3;
const HOLIDAYS = new Set(['12-30', '12-31', '01-01', '04-12', '04-13', '04-14', '04-15']);

// Seeded random number generator (Mulberry32)
function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Simple string hash function (cyrb53)
function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isHoliday(dateStr: string): boolean {
  const mmdd = dateStr.slice(5, 10);
  return HOLIDAYS.has(mmdd);
}

function getClosestAssignment(name: string, targetDateStr: string, assignedByDate: Map<string, Set<string>>): { distance: number, closestDate: string | null } {
  let minDistance = 999;
  let closestDate: string | null = null;
  const targetDate = new Date(targetDateStr);
  
  for (let i = -5; i <= 5; i++) {
    if (i === 0) continue;
    const checkDateStr = format(addDays(targetDate, i), 'yyyy-MM-dd');
    const set = assignedByDate.get(checkDateStr);
    if (set && set.has(name)) {
      if (Math.abs(i) < minDistance) {
        minDistance = Math.abs(i);
        closestDate = checkDateStr;
      }
    }
  }
  return { distance: minDistance, closestDate };
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

  // Create deterministic seed based on input
  const seedString = `${startDate.toISOString()}-${endDate.toISOString()}-${names.join(',')}`;
  const random = mulberry32(cyrb53(seedString));

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
      return random() - 0.5;
    });

    for (const day of shuffledWeek) {
      const dow = day.dayOfWeek;
      const dowCounter = dayCount[dow];

      const dists = new Map<string, ReturnType<typeof getClosestAssignment>>();
      for (const name of names) {
        dists.set(name, getClosestAssignment(name, day.date, assignedByDate));
      }

      // Initial pool: not used this week
      let pool = names.filter((name) => !usedThisWeek.has(name));

      // Try to find candidates with distance >= 5 in the unused pool
      const poolPerfect = pool.filter((name) => dists.get(name)!.distance >= 5);

      let candidates: string[];
      if (poolPerfect.length >= STUDENTS_PER_DAY) {
        candidates = poolPerfect;
      } else {
        // Not enough perfect candidates, fall back to unused pool (which includes some with dist < 5)
        if (pool.length >= STUDENTS_PER_DAY) {
          candidates = pool;
        } else {
          // Unused pool exhausted, must reuse students from this week
          candidates = [...names];
        }
      }

      // Sort priority:
      //   0. Penalty for distance < 5 (ascending)
      //   1. If holiday -> Holiday count (ascending)
      //   2. Total count (ascending)
      //   3. This specific day's count (ascending)
      //   4. Random tiebreak
      candidates.sort((a, b) => {
        const distA = dists.get(a)!.distance;
        const distB = dists.get(b)!.distance;
        const penaltyA = Math.max(0, 5 - distA);
        const penaltyB = Math.max(0, 5 - distB);

        if (penaltyA !== penaltyB) return penaltyA - penaltyB;

        if (day.holiday) {
          const hDiff = (holidayCount.get(a) ?? 0) - (holidayCount.get(b) ?? 0);
          if (hDiff !== 0) return hDiff;
        }

        const totalDiff = (totalCount.get(a) ?? 0) - (totalCount.get(b) ?? 0);
        if (totalDiff !== 0) return totalDiff;

        const dowDiff = (dowCounter.get(a) ?? 0) - (dowCounter.get(b) ?? 0);
        if (dowDiff !== 0) return dowDiff;

        return random() - 0.5;
      });

      const assigned = candidates.slice(0, STUDENTS_PER_DAY);
      const todaySet = assignedByDate.get(day.date)!;

      for (const name of assigned) {
        usedThisWeek.add(name);
        todaySet.add(name);
        totalCount.set(name, (totalCount.get(name) ?? 0) + 1);
        dowCounter.set(name, (dowCounter.get(name) ?? 0) + 1);
        if (day.holiday) holidayCount.set(name, (holidayCount.get(name) ?? 0) + 1);

        const closest = dists.get(name)!;
        if (closest.closestDate && closest.distance < 5) {
          const d1 = day.date < closest.closestDate ? day.date : closest.closestDate;
          const d2 = day.date < closest.closestDate ? closest.closestDate : day.date;
          warnings.add(`เวรห่างกันเพียง ${closest.distance} วัน: ${name} (${d1} และ ${d2})`);
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

