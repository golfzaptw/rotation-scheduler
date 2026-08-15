import React, { useState, useRef, useCallback } from 'react';
import type { Student } from '../types';
import './StudentManager.css';

interface StudentManagerProps {
  students: Student[];
  onAdd: (name: string) => void;
  onUpdate: (id: string, name: string) => void;
  onRemove: (id: string) => void;
  onBulkAdd: (names: string[]) => number;
  onClearAll: () => void;
}

/**
 * Parse file content into an array of student names.
 * Supports:
 *  - One name per line (TXT)
 *  - CSV: takes the first column, skips header if it looks like "name", "student", "#", "no"
 *  - Comma / semicolon / tab separated on a single line
 */
function parseFileContent(content: string, fileName: string): string[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const isCsv = fileName.toLowerCase().endsWith('.csv');

  // Detect if first line is a header
  const headerPatterns = /^(#|no\.?|name|student|ชื่อ|รายชื่อ|ลำดับ)/i;

  const names: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip header row
    if (i === 0 && headerPatterns.test(line)) continue;

    if (isCsv || line.includes(',') || line.includes('\t') || line.includes(';')) {
      // Split by common delimiters
      const parts = line.split(/[,;\t]+/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      // For CSV: try to find a name-like column (skip pure numbers)
      for (const part of parts) {
        if (part && !/^\d+$/.test(part)) {
          names.push(part);
          break; // Take first non-numeric column as name
        }
      }
    } else {
      // Plain text: one name per line
      names.push(line);
    }
  }

  return names;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  onAdd,
  onUpdate,
  onRemove,
  onBulkAdd,
  onClearAll,
}) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
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

  const startEdit = (student: Student) => {
    setEditingId(student.id);
    setEditValue(student.name);
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
    // Reset so same file can be re-uploaded
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const sorted = [...students].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="student-manager animate-fade-in">
      <h2 className="section-title">Students</h2>
      <p className="section-subtitle">
        Manage the student roster for clinical rotations.
      </p>

      {/* Add form */}
      <div className="input-row student-add-row">
        <input
          ref={inputRef}
          id="add-student-input"
          className="input"
          type="text"
          placeholder="Enter student name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          id="add-student-btn"
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={!newName.trim()}
        >
          + Add
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all students?')) {
              onClearAll();
            }
          }}
          disabled={students.length === 0}
          style={{ color: 'var(--color-danger)' }}
          title="Clear all students"
        >
          Clear All
        </button>
      </div>

      {/* File upload zone */}
      <div
        className={`upload-zone glass-card ${isDragOver ? 'upload-zone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
              {isDragOver ? 'Drop file here' : 'Upload student list'}
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
              Added <strong>{uploadResult.count}</strong> student
              {uploadResult.count !== 1 ? 's' : ''} from{' '}
              <strong>{uploadResult.fileName}</strong>
              {uploadResult.count === 0 && ' (all names already exist)'}
            </span>
          </div>
        )}
      </div>

      {/* Student list */}
      <div className="student-list glass-card">
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <p className="empty-state-text">
              No students yet. Add students above or upload a file to begin creating rotation schedules.
            </p>
          </div>
        ) : (
          sorted.map((student, index) => (
            <div
              key={student.id}
              className="list-item"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="student-index">{index + 1}</span>

              {editingId === student.id ? (
                <input
                  className="input student-edit-input"
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
                  onDoubleClick={() => startEdit(student)}
                >
                  {student.name}
                </span>
              )}

              <div className="list-item-actions">
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => startEdit(student)}
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => onRemove(student.id)}
                  title="Remove"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {sorted.length > 0 && (
        <div className="student-count">
          <span className="badge">{sorted.length} student{sorted.length !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};
