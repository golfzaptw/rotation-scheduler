import React from 'react';
import { DayPicker } from 'react-day-picker';
import { format, getDay, parseISO } from 'date-fns';
import type { Holiday } from '../types';
import 'react-day-picker/style.css';
import './HolidayPicker.css';

interface HolidayPickerProps {
  holidays: Holiday[];
  onToggle: (date: Date, label?: string) => void;
  onRemove: (dateStr: string) => void;
  onUpdateLabel: (dateStr: string, label: string) => void;
}

export const HolidayPicker: React.FC<HolidayPickerProps> = ({
  holidays,
  onToggle,
  onRemove,
  onUpdateLabel,
}) => {
  // Selected dates for the calendar
  const selectedDates = holidays.map((h) => parseISO(h.date));

  const handleDayClick = (day: Date) => {
    // Don't allow toggling weekends — they're auto-skipped
    const dow = getDay(day);
    if (dow === 0 || dow === 6) return;
    onToggle(day);
  };

  // Disable weekends in the calendar
  const isWeekend = (date: Date) => {
    const dow = getDay(date);
    return dow === 0 || dow === 6;
  };

  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="holiday-picker animate-fade-in">
      <h2 className="section-title">Holidays</h2>
      <p className="section-subtitle">
        Click on weekday dates to mark them as non-working days. Weekends are automatically skipped.
      </p>

      <div className="holiday-layout">
        {/* Calendar */}
        <div className="holiday-calendar-card glass-card">
          <DayPicker
            mode="multiple"
            selected={selectedDates}
            onDayClick={handleDayClick}
            disabled={isWeekend}
            numberOfMonths={2}
            showOutsideDays
            modifiers={{
              weekend: isWeekend,
            }}
            modifiersClassNames={{
              weekend: 'day-weekend',
            }}
          />
          <div className="holiday-calendar-hint">
            <span className="hint-dot hint-dot-holiday" />
            <span>Holiday</span>
            <span className="hint-dot hint-dot-weekend" />
            <span>Weekend (auto-skipped)</span>
          </div>
        </div>

        {/* Holiday list */}
        <div className="holiday-list-section">
          <h3 className="holiday-list-title">
            Marked Holidays
            <span className="badge">{sorted.length}</span>
          </h3>

          <div className="holiday-list glass-card">
            {sorted.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📆</div>
                <p className="empty-state-text">
                  No custom holidays marked. Click dates on the calendar to add non-working days.
                </p>
              </div>
            ) : (
              sorted.map((holiday) => {
                const dateObj = parseISO(holiday.date);
                return (
                  <div key={holiday.date} className="holiday-item list-item">
                    <span className="holiday-date-badge">
                      {format(dateObj, 'EEE')}
                    </span>
                    <div className="holiday-item-info">
                      <span className="holiday-item-date">
                        {format(dateObj, 'MMM d, yyyy')}
                      </span>
                      <input
                        className="holiday-label-input"
                        type="text"
                        placeholder="Add label..."
                        value={holiday.label}
                        onChange={(e) =>
                          onUpdateLabel(holiday.date, e.target.value)
                        }
                      />
                    </div>
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => onRemove(holiday.date)}
                      title="Remove holiday"
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
