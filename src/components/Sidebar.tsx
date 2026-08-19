import React from 'react';
import { TABS, type TabId } from '../types';
import './Sidebar.css';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  studentCount: number;
  stationCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  studentCount,
  stationCount,
}) => {
  const getCounts = (id: TabId): number | null => {
    switch (id) {
      case 'students': return studentCount;
      case 'stations': return stationCount;
      default: return null;
    }
  };

  return (
    <aside className="sidebar glass-card">
      <div className="sidebar-brand">
        <div className="sidebar-logo">R</div>
        <div className="sidebar-brand-text">
          <h1 className="sidebar-title">Rotation</h1>
          <span className="sidebar-subtitle">Clinical Scheduler</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {TABS.map((tab) => {
          const count = getCounts(tab.id);
          return (
            <button
              key={tab.id}
              id={`nav-${tab.id}`}
              className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="sidebar-nav-icon">{tab.icon}</span>
              <span className="sidebar-nav-label">{tab.label}</span>
              {count !== null && (
                <span className="sidebar-nav-badge">{count}</span>
              )}
              {activeTab === tab.id && (
                <span className="sidebar-nav-indicator" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-footer-text">v1.0 • localStorage</span>
      </div>
    </aside>
  );
};
