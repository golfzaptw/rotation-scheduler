import React from 'react';
import { format, parseISO } from 'date-fns';
import type { Student, ScheduleResult } from '../types';
import { getStationColor } from '../utils/colors';
import './ScheduleGrid.css';

interface ScheduleGridProps {
  students: Student[];
  schedule: ScheduleResult;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  students,
  schedule,
}) => {
  const sorted = [...students].sort((a, b) => a.sortOrder - b.sortOrder);

  if (schedule.workingDays.length === 0 || sorted.length === 0) {
    return null;
  }

  return (
    <div className="schedule-grid-wrapper">
      <div className="schedule-grid-scroll">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="schedule-th schedule-th-student">Student</th>
              {schedule.workingDays.map((dateStr) => {
                const date = parseISO(dateStr);
                return (
                  <th key={dateStr} className="schedule-th schedule-th-date">
                    <span className="schedule-date-dow">
                      {format(date, 'EEE')}
                    </span>
                    <span className="schedule-date-day">
                      {format(date, 'dd')}
                    </span>
                    <span className="schedule-date-month">
                      {format(date, 'MMM')}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((student, studentIdx) => (
              <tr key={student.id}>
                <td className="schedule-td schedule-td-student">
                  <span className="schedule-student-index">
                    {studentIdx + 1}
                  </span>
                  <span className="schedule-student-name">{student.name}</span>
                </td>
                {schedule.grid[studentIdx]?.map((stationName, dayIdx) => {
                  const colorIdx = schedule.stationIndices[studentIdx][dayIdx];
                  const color = getStationColor(colorIdx);
                  return (
                    <td
                      key={dayIdx}
                      className="schedule-td schedule-td-cell"
                      style={{
                        background: color.bg,
                        color: color.fg,
                      }}
                    >
                      <span className="schedule-cell-text">{stationName}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
