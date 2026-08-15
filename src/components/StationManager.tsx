import React, { useState, useRef } from 'react';
import type { Station } from '../types';
import { getStationColor } from '../utils/colors';
import './StationManager.css';

interface StationManagerProps {
  stations: Station[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClearAll: () => void;
}

export const StationManager: React.FC<StationManagerProps> = ({
  stations,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  onClearAll,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName);
      setNewName('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const startEdit = (station: Station) => {
    setEditingId(station.id);
    setEditValue(station.name);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onUpdate(editingId, editValue);
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
    }
  };

  // Drag & Drop
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (dragIndex !== null && dragIndex !== index) {
      onReorder(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const sorted = [...stations].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="station-manager animate-fade-in">
      <h2 className="section-title">Stations</h2>
      <p className="section-subtitle">
        Manage and reorder clinical stations. Drag to change rotation order.
      </p>

      {/* Add form */}
      <div className="input-row station-add-row">
        <input
          ref={inputRef}
          id="add-station-input"
          className="input"
          type="text"
          placeholder="Enter station name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          id="add-station-btn"
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          + Add
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all stations?')) {
              onClearAll();
            }
          }}
          disabled={stations.length === 0}
          style={{ color: 'var(--color-danger)' }}
          title="Clear all stations"
        >
          Clear All
        </button>
      </div>

      {/* Station list */}
      <div className="station-list glass-card">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏥</div>
            <p className="empty-state-text">
              No stations yet. Add stations to define the rotation cycle.
            </p>
          </div>
        ) : (
          sorted.map((station, index) => {
            const color = getStationColor(index);
            return (
              <div
                key={station.id}
                className={`list-item station-item ${
                  dragIndex === index ? 'dragging' : ''
                } ${dragOverIndex === index ? 'drag-over' : ''}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
              >
                <span className="drag-handle" title="Drag to reorder">
                  ⠿
                </span>

                <span
                  className="station-color-dot"
                  style={{ background: color.fg }}
                />

                <span className="station-order">{index + 1}</span>

                {editingId === station.id ? (
                  <input
                    className="input station-edit-input"
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    onBlur={commitEdit}
                    autoFocus
                  />
                ) : (
                  <span
                    className="list-item-name"
                    onDoubleClick={() => startEdit(station)}
                    style={{ color: color.fg }}
                  >
                    {station.name}
                  </span>
                )}

                <div className="list-item-actions">
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => startEdit(station)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => onRemove(station.id)}
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {sorted.length > 0 && (
        <div className="station-info">
          <span className="badge">{sorted.length} station{sorted.length !== 1 ? 's' : ''}</span>
          <span className="station-hint">Drag items to change rotation order</span>
        </div>
      )}
    </div>
  );
};
