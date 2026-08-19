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

  if (!schedule.columns || schedule.columns.length === 0 || sorted.length === 0) {
    return null;
  }

  return (
    <div className="schedule-grid-wrapper">
      <div className="schedule-grid-scroll">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="schedule-th schedule-th-student">Student</th>
              {schedule.columns.map((col, colIdx) => (
                <th key={colIdx} className="schedule-th schedule-th-date">
                  <div className="schedule-stacked-headers">
                    {col.weeks.map((week, idx) => (
                      <div key={idx} className="schedule-stacked-header-item">
                        <span className="schedule-date-weeknum">
                          wk{week.weekIndex + 1}
                        </span>
                        <span className="schedule-date-month">
                          {week.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </th>
              ))}
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
                {schedule.grid[studentIdx]?.map((stationName, weekIdx) => {
                  const colorIdx = schedule.stationIndices[studentIdx][weekIdx];
                  const color = getStationColor(colorIdx);
                  return (
                    <td
                      key={weekIdx}
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
