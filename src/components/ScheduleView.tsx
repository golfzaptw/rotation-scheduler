import React, { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import type { Student, Station, ScheduleResult } from '../types';
import { generateSchedule } from '../utils/scheduler';
import { ScheduleGrid } from './ScheduleGrid';
import { ExportButton } from './ExportButton';
import './ScheduleView.css';

interface ScheduleViewProps {
  students: Student[];
  stations: Station[];
  holidaySet: Set<string>;
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  students,
  stations,
  holidaySet,
}) => {
  const [startDate, setStartDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [numDays, setNumDays] = useState(20);
  const [schedule, setSchedule] = useState<ScheduleResult | null>(null);

  const canGenerate = students.length > 0 && stations.length > 0 && numDays > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;

    const result = generateSchedule({
      students,
      stations,
      holidays: holidaySet,
      startDate: new Date(startDate + 'T00:00:00'),
      numWorkingDays: numDays,
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
        one station per working day.
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

        <div className="schedule-control-group schedule-control-days">
          <label className="schedule-label">
            Working Days: <strong>{numDays}</strong>
          </label>
          <div className="schedule-presets">
            {[
              { label: '1 สัปดาห์', days: 5 },
              { label: '2 สัปดาห์', days: 10 },
              { label: '1 เดือน', days: 22 },
              { label: '2 เดือน', days: 44 },
              { label: '3 เดือน', days: 66 },
            ].map((preset) => (
              <button
                key={preset.days}
                className={`schedule-preset-chip ${numDays === preset.days ? 'active' : ''}`}
                onClick={() => setNumDays(preset.days)}
              >
                {preset.label}
              </button>
            ))}
            <div className="schedule-custom-input">
              <span className="schedule-custom-label">กำหนดเอง:</span>
              <input
                id="schedule-num-days"
                className="input schedule-num-input"
                type="number"
                min={1}
                max={365}
                value={numDays}
                onChange={(e) => setNumDays(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>
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
            <span className="schedule-stat-value">{schedule.workingDays.length}</span>
            <span className="schedule-stat-label">Working Days</span>
          </div>
          <div className="schedule-stat">
            <span className="schedule-stat-value">{holidaySet.size}</span>
            <span className="schedule-stat-label">Holidays</span>
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
                {format(parseISO(schedule.workingDays[0]), 'dd MMM yyyy')}
                {' — '}
                {format(
                  parseISO(schedule.workingDays[schedule.workingDays.length - 1]),
                  'dd MMM yyyy'
                )}
              </span>
              <span>•</span>
              <span>{sortedStudents.length} Students</span>
              <span>•</span>
              <span>{stations.length} Stations</span>
              <span>•</span>
              <span>{schedule.workingDays.length} Working Days</span>
            </div>
          </div>
          <ScheduleGrid students={sortedStudents} schedule={schedule} />
          <div className="print-footer">
            Generated on {format(new Date(), 'dd MMM yyyy, HH:mm')}
          </div>
        </div>
      )}
    </div>
  );
};
