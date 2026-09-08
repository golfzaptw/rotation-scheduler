import { useState, useCallback, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { Station } from '../types';

export function useStations() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stationsRef = collection(db, 'stations');
    const unsubscribe = onSnapshot(stationsRef, (snapshot) => {
      const data: Station[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Station);
      });
      // Sort by sortOrder
      data.sort((a, b) => a.sortOrder - b.sortOrder);
      setStations(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching stations:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addStation = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const id = crypto.randomUUID();
      const newStation: Station = {
        id,
        name: trimmed,
        sortOrder: stations.length,
      };

      try {
        await setDoc(doc(db, 'stations', id), newStation);
      } catch (e) {
        console.error("Error adding station:", e);
      }
    },
    [stations]
  );

  const updateStation = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      try {
        await setDoc(doc(db, 'stations', id), { name: trimmed }, { merge: true });
      } catch (e) {
        console.error("Error updating station:", e);
      }
    },
    []
  );

  const removeStation = useCallback(
    async (id: string) => {
      try {
        const next = stations
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, sortOrder: i }));
          
        const batch = writeBatch(db);
        batch.delete(doc(db, 'stations', id));
        
        next.forEach((s) => {
          batch.update(doc(db, 'stations', s.id), { sortOrder: s.sortOrder });
        });
        
        await batch.commit();
      } catch (e) {
        console.error("Error removing station:", e);
      }
    },
    [stations]
  );

  const reorderStations = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const next = [...stations];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const reordered = next.map((s, i) => ({ ...s, sortOrder: i }));
      
      try {
        const batch = writeBatch(db);
        reordered.forEach((s) => {
          batch.update(doc(db, 'stations', s.id), { sortOrder: s.sortOrder });
        });
        await batch.commit();
      } catch (e) {
        console.error("Error reordering stations:", e);
      }
    },
    [stations]
  );

  const bulkAddStations = useCallback(
    (names: string[]) => {
      const existingNames = new Set(stations.map((s) => s.name.toLowerCase()));
      const newStations: Station[] = [];
      let order = stations.length;

      for (const raw of names) {
        const name = raw.trim();
        if (!name) continue;
        if (existingNames.has(name.toLowerCase())) continue;
        existingNames.add(name.toLowerCase());
        newStations.push({
          id: crypto.randomUUID(),
          name,
          sortOrder: order++,
        });
      }

      if (newStations.length > 0) {
        try {
          const batch = writeBatch(db);
          newStations.forEach((s) => {
            batch.set(doc(db, 'stations', s.id), s);
          });
          batch.commit();
        } catch (e) {
          console.error("Error bulk adding stations:", e);
        }
      }

      return newStations.length;
    },
    [stations]
  );

  const clearStations = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      stations.forEach((s) => {
        batch.delete(doc(db, 'stations', s.id));
      });
      await batch.commit();
    } catch (e) {
      console.error("Error clearing stations:", e);
    }
  }, [stations]);

  return { stations, loading, addStation, updateStation, removeStation, reorderStations, bulkAddStations, clearStations };
}
