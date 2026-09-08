import React, { useState, useRef, useCallback } from 'react';
import type { Station } from '../types';
import { getStationColor } from '../utils/colors';
import { parseFileContent } from '../utils/fileParser';
import './StationManager.css';

interface StationManagerProps {
  stations: Station[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onBulkAdd: (names: string[]) => number;
  onClearAll: () => void;
}

export const StationManager: React.FC<StationManagerProps> = ({
  stations,
  onAdd,
  onUpdate,
  onRemove,
  onReorder,
  onBulkAdd,
  onClearAll,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ count: number; fileName: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- File upload logic ---
  const processFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (!content) return;

        const names = parseFileContent(content, file.name);
        const added = onBulkAdd(names);

        setUploadResult({ count: added, fileName: file.name });
        setTimeout(() => setUploadResult(null), 4000);
      };
      reader.readAsText(file);
    },
    [onBulkAdd]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOverUpload = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeaveUpload = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDropUpload = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  // Drag & Drop (for list items)
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

      {/* File upload zone */}
      <div
        className={`upload-zone glass-card ${isDragOver ? 'upload-zone-active' : ''}`}
        onDragOver={handleDragOverUpload}
        onDragLeave={handleDragLeaveUpload}
        onDrop={handleDropUpload}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt,.tsv"
          className="upload-input-hidden"
          onChange={handleFileChange}
        />
        <div className="upload-zone-content">
          <div className="upload-icon">{isDragOver ? '📥' : '📄'}</div>
          <div className="upload-text">
            <span className="upload-text-main">
              {isDragOver ? 'Drop file here' : 'Upload station list'}
            </span>
            <span className="upload-text-sub">
              Drag & drop or click — supports .csv, .txt (one name per line)
            </span>
          </div>
          <button
            className="btn btn-secondary upload-browse-btn"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse
          </button>
        </div>

        {/* Upload result toast */}
        {uploadResult && (
          <div className="upload-result animate-fade-in">
            <span className="upload-result-icon">✅</span>
            <span>
              Added <strong>{uploadResult.count}</strong> station
              {uploadResult.count !== 1 ? 's' : ''} from{' '}
              <strong>{uploadResult.fileName}</strong>
              {uploadResult.count === 0 && ' (all names already exist)'}
            </span>
          </div>
        )}
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
