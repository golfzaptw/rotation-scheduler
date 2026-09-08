import { useState, useCallback, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../utils/firebase';
import type { Student } from '../types';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const studentsRef = collection(db, 'students');
    const unsubscribe = onSnapshot(studentsRef, (snapshot) => {
      const data: Student[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Student);
      });
      // Sort by sortOrder
      data.sort((a, b) => a.sortOrder - b.sortOrder);
      setStudents(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching students:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addStudent = useCallback(
    async (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const id = crypto.randomUUID();
      const newStudent: Student = {
        id,
        name: trimmed,
        sortOrder: students.length,
      };

      try {
        await setDoc(doc(db, 'students', id), newStudent);
      } catch (e) {
        console.error("Error adding student:", e);
      }
    },
    [students]
  );

  const updateStudent = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      try {
        await setDoc(doc(db, 'students', id), { name: trimmed }, { merge: true });
      } catch (e) {
        console.error("Error updating student:", e);
      }
    },
    []
  );

  const removeStudent = useCallback(
    async (id: string) => {
      try {
        // We also need to reorder the remaining students to prevent gaps,
        // but for simplicity and performance, we can just delete. 
        // If strict ordering is required without gaps, we'd batch update here.
        // Let's do a batch update to maintain sortOrder just like the original code.
        const next = students
          .filter((s) => s.id !== id)
          .map((s, i) => ({ ...s, sortOrder: i }));
          
        const batch = writeBatch(db);
        batch.delete(doc(db, 'students', id));
        
        next.forEach((s) => {
          batch.update(doc(db, 'students', s.id), { sortOrder: s.sortOrder });
        });
        
        await batch.commit();
      } catch (e) {
        console.error("Error removing student:", e);
      }
    },
    [students]
  );

  const reorderStudents = useCallback(
    async (fromIndex: number, toIndex: number) => {
      const next = [...students];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const reordered = next.map((s, i) => ({ ...s, sortOrder: i }));
      
      try {
        const batch = writeBatch(db);
        reordered.forEach((s) => {
          batch.update(doc(db, 'students', s.id), { sortOrder: s.sortOrder });
        });
        await batch.commit();
      } catch (e) {
        console.error("Error reordering students:", e);
      }
    },
    [students]
  );

  const bulkAddStudents = useCallback(
    (names: string[]) => {
      const existingNames = new Set(students.map((s) => s.name.toLowerCase()));
      const newStudents: Student[] = [];
      let order = students.length;

      for (const raw of names) {
        const name = raw.trim();
        if (!name) continue;
        if (existingNames.has(name.toLowerCase())) continue;
        existingNames.add(name.toLowerCase());
        newStudents.push({
          id: crypto.randomUUID(),
          name,
          sortOrder: order++,
        });
      }

      if (newStudents.length > 0) {
        try {
          const batch = writeBatch(db);
          newStudents.forEach((s) => {
            batch.set(doc(db, 'students', s.id), s);
          });
          batch.commit();
        } catch (e) {
          console.error("Error bulk adding students:", e);
        }
      }

      return newStudents.length;
    },
    [students]
  );

  const clearStudents = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      students.forEach((s) => {
        batch.delete(doc(db, 'students', s.id));
      });
      await batch.commit();
    } catch (e) {
      console.error("Error clearing students:", e);
    }
  }, [students]);

  return { students, loading, addStudent, updateStudent, removeStudent, reorderStudents, bulkAddStudents, clearStudents };
}
