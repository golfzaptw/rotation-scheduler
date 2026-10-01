import React, { useState } from 'react';
import type { TabId } from './types';
import { useStudents } from './hooks/useStudents';
import { useStations } from './hooks/useStations';
import { Sidebar } from './components/Sidebar';
import { ScheduleView } from './components/ScheduleView';
import { StudentManager } from './components/StudentManager';
import { StationManager } from './components/StationManager';
import { DutyScheduleView } from './components/DutyScheduleView';
import { AboutView } from './components/AboutView';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('about');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    students,
    loading: studentsLoading,
    addStudent,
    updateStudent,
    removeStudent,
    bulkAddStudents,
    clearStudents,
  } = useStudents();

  const {
    stations,
    loading: stationsLoading,
    addStation,
    updateStation,
    removeStation,
    reorderStations,
    bulkAddStations,
    clearStations,
  } = useStations();

  const renderContent = () => {
    switch (activeTab) {
      case 'about':
        return <AboutView />;
      case 'schedule':
        return (
          <ScheduleView
            students={students}
            stations={stations}
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
            onBulkAdd={bulkAddStations}
            onClearAll={clearStations}
          />
        );
      case 'duty':
        return <DutyScheduleView students={students} />;
    }
  };

  if (studentsLoading || stationsLoading) {
    return (
      <div className="app-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Loading data...</h2>
          <p>Connecting to Firebase Firestore</p>
        </div>
      </div>
    );
  }

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false); // Close menu on mobile after selection
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        studentCount={students.length}
        stationCount={stations.length}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="app-main">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="mobile-header-title">Rotation Scheduler</div>
        </div>

        <div className="app-content">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
