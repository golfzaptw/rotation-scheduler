import React, { useState, useMemo } from 'react';
import { format, addDays, parseISO, getDay, startOfMonth, endOfMonth, startOfWeek, addWeeks, isSameMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Student, DutyScheduleResult } from '../types';
import { generateDutySchedule } from '../utils/dutyScheduler';
import { exportDutyCSV, exportDutyExcel, exportDutyImage } from '../utils/dutyExport';
import './DutyScheduleView.css';

interface DutyScheduleViewProps {
  students: Student[];
}

const DAY_HEADERS = [
  { label: 'อาทิตย์', weekend: true },
  { label: 'จันทร์', weekend: false },
  { label: 'อังคาร', weekend: false },
  { label: 'พุธ', weekend: false },
  { label: 'พฤหัสบดี', weekend: false },
  { label: 'ศุกร์', weekend: false },
  { label: 'เสาร์', weekend: true },
];

/** Group duty days into months, each month into calendar weeks (Mon-Sun) */
function buildCalendar(result: DutyScheduleResult) {
  if (result.days.length === 0) return [];

  const dayMap = new Map(result.days.map((d) => [d.date, d]));
  const start = parseISO(result.startDate);
  const end = parseISO(result.endDate);

  // Collect unique months
  const months: { year: number; month: number }[] = [];
  let cursor = startOfMonth(start);
  while (cursor <= end) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return months.map(({ year, month }) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = endOfMonth(monthStart);
    const label = format(monthStart, 'MMMM yyyy', { locale: th });

    // Build week rows (Sun=0 ... Sat=6 in our grid)
    const weeks: (typeof result.days[number] | null)[][] = [];
    let weekStart = startOfWeek(monthStart, { weekStartsOn: 0 });

    while (weekStart <= monthEnd) {
      const week: (typeof result.days[number] | null)[] = [];
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekStart, i);
        const key = format(d, 'yyyy-MM-dd');
        if (isSameMonth(d, monthStart) && dayMap.has(key)) {
          week.push(dayMap.get(key)!);
        } else if (isSameMonth(d, monthStart)) {
          // Day in month but outside schedule range
          week.push(null);
        } else {
          week.push(null);
        }
      }
      // Only include week if it has at least one day in this month
      if (week.some((d) => d !== null)) {
        weeks.push(week);
      }
      weekStart = addWeeks(weekStart, 1);
    }

    return { label, weeks };
  });
}

export const DutyScheduleView: React.FC<DutyScheduleViewProps> = ({ students }) => {
  const [startDate, setStartDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(() => format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [result, setResult] = useState<DutyScheduleResult | null>(null);

  const canGenerate = students.length >= 3 && new Date(startDate) <= new Date(endDate);

  const handleGenerate = () => {
    if (!canGenerate) return;
    const r = generateDutySchedule(
      students,
      new Date(startDate + 'T00:00:00'),
      new Date(endDate + 'T00:00:00'),
    );
    setResult(r);
  };

  const calendar = useMemo(() => (result ? buildCalendar(result) : []), [result]);

  const warnings: string[] = [];
  if (students.length < 3) warnings.push('ต้องมีนักเรียนอย่างน้อย 3 คน (เพิ่มได้ที่ Students tab)');

  return (
    <div className="duty-view animate-fade-in">
      <h2 className="section-title">ตารางเวรพยาบาล</h2>
      <p className="section-subtitle">
        จัดเวรนักเรียนพยาบาล 3 คน/วัน (จันทร์-อาทิตย์) กระจายให้เท่าเทียม
      </p>

      {/* Controls */}
      <div className="duty-controls glass-card">
        <div className="duty-control-group">
          <label className="duty-label" htmlFor="duty-start">วันเริ่มต้น</label>
          <input
            id="duty-start"
            className="input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="duty-control-group">
          <label className="duty-label" htmlFor="duty-end">วันสิ้นสุด</label>
          <input
            id="duty-end"
            className="input"
            type="date"
            min={startDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="duty-control-actions">
          <button
            id="generate-duty-btn"
            className="btn btn-primary"
            onClick={handleGenerate}
            disabled={!canGenerate}
          >
            ⚡ จัดตารางเวร
          </button>
          {result && (
            <>
              <button className="btn btn-secondary" onClick={() => exportDutyCSV(result)}>📊 CSV</button>
              <button className="btn btn-secondary" onClick={() => exportDutyExcel(result)}>📗 Excel</button>
              <button className="btn btn-secondary" onClick={() => exportDutyImage('duty-printable')}>🖼️ PNG</button>
              <button className="btn btn-secondary" onClick={() => window.print()}>🖨️ Print</button>
            </>
          )}
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="duty-warnings">
          {warnings.map((w, i) => (
            <div key={i} className="duty-warning">⚠️ {w}</div>
          ))}
        </div>
      )}

      {/* Summary stats */}
      {result && (
        <div className="duty-summary">
          <div className="duty-summary-card">
            <span className="duty-summary-value">{students.length}</span>
            <span className="duty-summary-label">นักเรียน</span>
          </div>
          <div className="duty-summary-card">
            <span className="duty-summary-value">{result.days.length}</span>
            <span className="duty-summary-label">วันทั้งหมด</span>
          </div>
          <div className="duty-summary-card">
            <span className="duty-summary-value">{result.days.filter((d) => !d.isWeekend).length}</span>
            <span className="duty-summary-label">วันธรรมดา</span>
          </div>
          <div className="duty-summary-card">
            <span className="duty-summary-value">{result.days.filter((d) => d.isWeekend).length}</span>
            <span className="duty-summary-label">วันหยุด</span>
          </div>
        </div>
      )}

      {/* Calendar */}
      {result && (
        <div id="duty-printable">
          <div className="duty-calendar">
            {calendar.map((month, mi) => (
              <div key={mi} className="duty-month-block glass-card">
                <h3 className="duty-month-title">{month.label}</h3>
                <div className="duty-grid">
                  {/* Header row */}
                  {DAY_HEADERS.map((h, hi) => (
                    <div key={hi} className={`duty-grid-header ${h.weekend ? 'weekend-header' : ''}`}>
                      {h.label}
                    </div>
                  ))}
                  {/* Week rows */}
                  {month.weeks.map((week, wi) =>
                    week.map((day, di) => {
                      if (!day) {
                        return <div key={`${wi}-${di}`} className="duty-cell empty" />;
                      }
                      return (
                        <div
                          key={day.date}
                          className={`duty-cell ${day.isWeekend ? 'weekend' : ''}`}
                        >
                          <span className="duty-date-num">
                            {parseInt(day.date.split('-')[2], 10)}
                          </span>
                          {day.assignedStudents.map((name, ni) => (
                            <span key={ni} className="duty-student-chip">{name}</span>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Stats table */}
          <div className="duty-stats-section glass-card" style={{ marginTop: '1.5rem' }}>
            <h3 className="duty-stats-title">📊 สรุปจำนวนเวรต่อคน</h3>
            <table className="duty-stats-table">
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th className="stat-num stat-weekend">อา.</th>
                  <th className="stat-num">จ.</th>
                  <th className="stat-num">อ.</th>
                  <th className="stat-num">พ.</th>
                  <th className="stat-num">พฤ.</th>
                  <th className="stat-num">ศ.</th>
                  <th className="stat-num stat-weekend">ส.</th>
                  <th className="stat-num">รวม</th>
                </tr>
              </thead>
              <tbody>
                {result.stats.map((s) => (
                  <tr key={s.studentName}>
                    <td>{s.studentName}</td>
                    <td className="stat-num stat-weekend">{s.perDay[0]}</td>
                    <td className="stat-num stat-weekday">{s.perDay[1]}</td>
                    <td className="stat-num stat-weekday">{s.perDay[2]}</td>
                    <td className="stat-num stat-weekday">{s.perDay[3]}</td>
                    <td className="stat-num stat-weekday">{s.perDay[4]}</td>
                    <td className="stat-num stat-weekday">{s.perDay[5]}</td>
                    <td className="stat-num stat-weekend">{s.perDay[6]}</td>
                    <td className="stat-num stat-total">{s.totalCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
