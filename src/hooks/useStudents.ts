import { useState, useCallback } from 'react';
import type { Student } from '../types';
import { loadStudents, saveStudents } from '../utils/storage';

export function useStudents() {
  const [students, setStudents] = useState<Student[]>(() => loadStudents());

  const persist = useCallback((next: Student[]) => {
    setStudents(next);
    saveStudents(next);
  }, []);

  const addStudent = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const next: Student[] = [
        ...students,
        {
          id: crypto.randomUUID(),
          name: trimmed,
          sortOrder: students.length,
        },
      ];
      persist(next);
    },
    [students, persist]
  );

  const updateStudent = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;

      const next = students.map((s) =>
        s.id === id ? { ...s, name: trimmed } : s
      );
      persist(next);
    },
    [students, persist]
  );

  const removeStudent = useCallback(
    (id: string) => {
      const next = students
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, sortOrder: i }));
      persist(next);
    },
    [students, persist]
  );

  const reorderStudents = useCallback(
    (fromIndex: number, toIndex: number) => {
      const next = [...students];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      const reordered = next.map((s, i) => ({ ...s, sortOrder: i }));
      persist(reordered);
    },
    [students, persist]
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
        persist([...students, ...newStudents]);
      }

      return newStudents.length;
    },
    [students, persist]
  );

  const clearStudents = useCallback(() => {
    persist([]);
  }, [persist]);

  return { students, addStudent, updateStudent, removeStudent, reorderStudents, bulkAddStudents, clearStudents };
}
