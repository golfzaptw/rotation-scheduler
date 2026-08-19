import React, { useState, useMemo } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import type { Student, Station, ScheduleResult } from '../types';
import { generateSchedule } from '../utils/scheduler';
import { ScheduleGrid } from './ScheduleGrid';
import { ExportButton } from './ExportButton';
import './ScheduleView.css';

interface ScheduleViewProps {
  students: Student[];
  stations: Station[];
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  students,
  stations,
}) => {
  const [startDate, setStartDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(() =>
    format(addDays(new Date(), 28), 'yyyy-MM-dd')
  );
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);

  const canGenerate = students.length > 0 && stations.length > 0 && new Date(startDate) <= new Date(endDate);

  const handleGenerate = () => {
    if (!canGenerate) return;

    const result = generateSchedule({
      students,
      stations,
      startDate: new Date(startDate + 'T00:00:00'),
      endDate: new Date(endDate + 'T00:00:00'),
    });

    setSchedule(result);
  };

  const handlePrint = () => {
    window.print();
  };

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.sortOrder - b.sortOrder),
    [students]
  );

  // Warnings
  const warnings: string[] = [];
  if (students.length === 0) warnings.push('Add students in the Students tab');
  if (stations.length === 0) warnings.push('Add stations in the Stations tab');

  return (
    <div className="schedule-view animate-fade-in">
      <h2 className="section-title">Rotation Schedule</h2>
      <p className="section-subtitle">
        Generate a round-robin clinical rotation schedule. Each student advances
        one station per week.
      </p>

      {/* Controls */}
      <div className="schedule-controls glass-card">
        <div className="schedule-control-group">
          <label className="schedule-label" htmlFor="schedule-start-date">
            Start Date
          </label>
          <input
            id="schedule-start-date"
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="schedule-control-group">
          <label className="schedule-label" htmlFor="schedule-end-date">
            End Date
          </label>
          <input
            id="schedule-end-date"
            className="input"
            type="date"
            min={startDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="schedule-control-actions">
          <button
            id="generate-schedule-btn"
            className="btn btn-primary schedule-generate-btn"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            ⚡ Generate Schedule
          </button>

          {schedule && (
            <>
              <ExportButton
                schedule={schedule}
                students={sortedStudents}
              />
              <button
                id="print-schedule-btn"
                className="btn btn-secondary"
                onClick={handlePrint}
                title="Print schedule"
              >
                🖨️ Print
              </button>
            </>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="schedule-warnings">
          {warnings.map((w, i) => (
            <div key={i} className="schedule-warning">
              ⚠️ {w}
            </div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {schedule && (
        <div className="schedule-stats">
          <div className="schedule-stat">
            <span className="schedule-stat-value">{sortedStudents.length}</span>
            <span className="schedule-stat-label">Students</span>
          </div>
          <div className="schedule-stat">
            <span className="schedule-stat-value">{stations.length}</span>
            <span className="schedule-stat-label">Stations</span>
          </div>
          <div className="schedule-stat">
            <span className="schedule-stat-value">{schedule.totalWeeks}</span>
            <span className="schedule-stat-label">Weeks</span>
          </div>

        </div>
      )}

      {/* Grid */}
      {schedule && (
        <div id="printable-schedule">
          {/* Print-only header */}
          <div className="print-header">
            <h1 className="print-title">Clinical Rotation Schedule</h1>
            <div className="print-meta">
              <span>
                {schedule.startDate ? format(parseISO(schedule.startDate), 'dd MMM yyyy') : ''}
                {' — '}
                {schedule.endDate ? format(parseISO(schedule.endDate), 'dd MMM yyyy') : ''}
              </span>
              <span>•</span>
              <span>{sortedStudents.length} Students</span>
              <span>•</span>
              <span>{stations.length} Stations</span>
              <span>•</span>
              <span>{schedule.totalWeeks} Weeks</span>
              <span>•</span>
              <span>Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}</span>
            </div>
          </div>
          <ScheduleGrid students={sortedStudents} schedule={schedule} />
        </div>
      )}
    </div>
  );
};
