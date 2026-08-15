import React from 'react';
import { format, parseISO } from 'date-fns';
import type { Student, ScheduleResult } from '../types';
import './ExportButton.css';

interface ExportButtonProps {
  schedule: ScheduleResult;
  students: Student[];
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  schedule,
  students,
}) => {
  const exportCSV = () => {
    const headers = [
      'Student',
      ...schedule.workingDays.map((d) =>
        format(parseISO(d), 'EEE dd/MM/yyyy')
      ),
    ];

    const rows = students.map((student, idx) => [
      student.name,
      ...(schedule.grid[idx] || []),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${cell}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rotation-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      workingDays: schedule.workingDays,
      students: students.map((s, idx) => ({
        name: s.name,
        assignments: schedule.workingDays.reduce(
          (acc, day, dayIdx) => {
            acc[day] = schedule.grid[idx]?.[dayIdx] || '';
            return acc;
          },
          {} as Record<string, string>
        ),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rotation-schedule-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="export-buttons">
      <button className="btn btn-secondary" onClick={exportCSV} title="Export as CSV">
        📊 CSV
      </button>
      <button className="btn btn-secondary" onClick={exportJSON} title="Export as JSON">
        📋 JSON
      </button>
    </div>
  );
};
