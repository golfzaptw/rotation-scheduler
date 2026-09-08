/**
 * Parse file content into an array of strings (names).
 * Supports:
 *  - One name per line (TXT)
 *  - CSV: takes the first column, skips header if it looks like "name", "student", "#", "no", "station", etc.
 *  - Comma / semicolon / tab separated on a single line
 */
export function parseFileContent(content: string, fileName: string): string[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const isCsv = fileName.toLowerCase().endsWith('.csv');

  // Detect if first line is a header
  const headerPatterns = /^(#|no\.?|name|student|station|ชื่อ|รายชื่อ|ลำดับ)/i;

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
