import { useState, useCallback } from 'react';
import type { Station } from '../types';
import { loadStations, saveStations } from '../utils/storage';

export function useStations() {
  const [stations, setStations] = useState<Station[]>(() => loadStations());

  const persist = useCallback((next: Station[]) => {
    setStations(next);
    saveStations(next);
  }, []);

  const addStation = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const next: Station[] = [
        ...stations,
        {
          id: crypto.randomUUID(),
          name: trimmed,
          sortOrder: stations.length,
        },
      ];
      persist(next);
    },
    [stations, persist]
  );

  const updateStation = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const next = stations.map((s) =>
        s.id === id ? { ...s, name: trimmed } : s
      );
      persist(next);
    },
    [stations, persist]
  );

  const removeStation = useCallback(
    (id: string) => {
      const next = stations
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, sortOrder: i }));
      persist(next);
    },
    [stations, persist]
  );

  const reorderStations = useCallback(
    (fromIndex: number, toIndex: number) => {
      const next = [...stations];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const reordered = next.map((s, i) => ({ ...s, sortOrder: i }));
      persist(reordered);
    },
    [stations, persist]
  );

  const clearStations = useCallback(() => {
    persist([]);
  }, [persist]);

  return { stations, addStation, updateStation, removeStation, reorderStations, clearStations };
}
