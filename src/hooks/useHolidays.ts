import { useState, useCallback, useMemo } from 'react';
import type { Holiday } from '../types';
import { loadHolidays, saveHolidays } from '../utils/storage';
import { format } from 'date-fns';

export function useHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>(() => loadHolidays());

  const persist = useCallback((next: Holiday[]) => {
    setHolidays(next);
    saveHolidays(next);
  }, []);

  const holidaySet = useMemo(
    () => new Set(holidays.map((h) => h.date)),
    [holidays]
  );

  const isHoliday = useCallback(
    (date: Date): boolean => {
      return holidaySet.has(format(date, 'yyyy-MM-dd'));
    },
    [holidaySet]
  );

  const toggleHoliday = useCallback(
    (date: Date, label = '') => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const exists = holidays.find((h) => h.date === dateStr);

      if (exists) {
        const next = holidays.filter((h) => h.date !== dateStr);
        persist(next);
      } else {
        const next = [...holidays, { date: dateStr, label }].sort(
          (a, b) => a.date.localeCompare(b.date)
        );
        persist(next);
      }
    },
    [holidays, persist]
  );

  const removeHoliday = useCallback(
    (dateStr: string) => {
      const next = holidays.filter((h) => h.date !== dateStr);
      persist(next);
    },
    [holidays, persist]
  );

  const updateHolidayLabel = useCallback(
    (dateStr: string, label: string) => {
      const next = holidays.map((h) =>
        h.date === dateStr ? { ...h, label } : h
      );
      persist(next);
    },
    [holidays, persist]
  );

  return {
    holidays,
    holidaySet,
    isHoliday,
    toggleHoliday,
    removeHoliday,
    updateHolidayLabel,
  };
}
