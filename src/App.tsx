import React, { useState } from 'react';
import type { TabId } from './types';
import { useStudents } from './hooks/useStudents';
import { useStations } from './hooks/useStations';
import { useHolidays } from './hooks/useHolidays';
import { Sidebar } from './components/Sidebar';
import { ScheduleView } from './components/ScheduleView';
import { StudentManager } from './components/StudentManager';
import { StationManager } from './components/StationManager';
import { HolidayPicker } from './components/HolidayPicker';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('schedule');

  const {
    students,
    addStudent,
    updateStudent,
    removeStudent,
    bulkAddStudents,
    clearStudents,
  } = useStudents();

  const {
    stations,
    addStation,
    updateStation,
    removeStation,
    reorderStations,
    clearStations,
  } = useStations();

  const {
    holidays,
    holidaySet,
    toggleHoliday,
    removeHoliday,
    updateHolidayLabel,
  } = useHolidays();

  const renderContent = () => {
    switch (activeTab) {
      case 'schedule':
        return (
          <ScheduleView
            students={students}
            stations={stations}
            holidaySet={holidaySet}
          />
        );
      case 'students':
        return (
          <StudentManager
            students={students}
            onAdd={addStudent}
            onUpdate={updateStudent}
            onRemove={removeStudent}
            onBulkAdd={bulkAddStudents}
            onClearAll={clearStudents}
          />
        );
      case 'stations':
        return (
          <StationManager
            stations={stations}
            onAdd={addStation}
            onUpdate={updateStation}
            onRemove={removeStation}
            onReorder={reorderStations}
            onClearAll={clearStations}
          />
        );
      case 'holidays':
        return (
          <HolidayPicker
            holidays={holidays}
            onToggle={toggleHoliday}
            onRemove={removeHoliday}
            onUpdateLabel={updateHolidayLabel}
          />
        );
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        studentCount={students.length}
        stationCount={stations.length}
        holidayCount={holidays.length}
      />
      <main className="app-main">
        <div className="app-content">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
