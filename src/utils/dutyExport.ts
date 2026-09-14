import { format } from 'date-fns';
import type { DutyScheduleResult, Student } from '../types';

const DAY_NAMES_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export function exportDutyCSV(result: DutyScheduleResult): void {
  const header = ['วันที่', 'วัน', 'ประเภท', 'คนที่ 1', 'คนที่ 2', 'คนที่ 3'];
  const rows = result.days.map((d) => [
    d.date,
    DAY_NAMES_TH[d.dayOfWeek],
    d.isWeekend ? 'วันหยุด' : 'วันธรรมดา',
    ...d.assignedStudents,
  ]);

  // Stats section
  const statsHeader = ['', '', '', '', '', ''];
  const statsTitle = ['สรุปสถิติ', '', '', '', '', ''];
  const statsCols = ['ชื่อ', 'อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.', 'รวม'];
  const statsRows = result.stats.map((s) => [
    s.studentName,
    // Sun(0), Mon(1), Tue(2), Wed(3), Thu(4), Fri(5), Sat(6)
    ...[0, 1, 2, 3, 4, 5, 6].map((dow) => String(s.perDay[dow])),
    String(s.totalCount),
  ]);

  const all = [header, ...rows, statsHeader, statsTitle, statsCols, ...statsRows];
  const csvContent = '\uFEFF' + all.map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');

  downloadBlob(csvContent, 'text/csv;charset=utf-8;', `duty-schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`);
}

export async function exportDutyExcel(result: DutyScheduleResult): Promise<void> {
  const XLSX = await import('xlsx');

  // Schedule sheet
  const scheduleData = result.days.map((d) => ({
    'วันที่': d.date,
    'วัน': DAY_NAMES_TH[d.dayOfWeek],
    'ประเภท': d.isWeekend ? 'วันหยุด' : 'วันธรรมดา',
    'คนที่ 1': d.assignedStudents[0] ?? '',
    'คนที่ 2': d.assignedStudents[1] ?? '',
    'คนที่ 3': d.assignedStudents[2] ?? '',
  }));

  // Stats sheet
  const statsData = result.stats.map((s) => ({
    'ชื่อ': s.studentName,
    'อา.': s.perDay[0],
    'จ.': s.perDay[1],
    'อ.': s.perDay[2],
    'พ.': s.perDay[3],
    'พฤ.': s.perDay[4],
    'ศ.': s.perDay[5],
    'ส.': s.perDay[6],
    'รวม': s.totalCount,
  }));

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(scheduleData);
  const ws2 = XLSX.utils.json_to_sheet(statsData);

  // Set column widths
  ws1['!cols'] = [{ wch: 12 }, { wch: 6 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
  ws2['!cols'] = [{ wch: 20 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 8 }];

  XLSX.utils.book_append_sheet(wb, ws1, 'ตารางเวร');
  XLSX.utils.book_append_sheet(wb, ws2, 'สถิติ');
  XLSX.writeFile(wb, `duty-schedule-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

export async function exportDutyImage(elementId: string): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;
  const el = document.getElementById(elementId);
  if (!el) return;

  const canvas = await html2canvas(el, {
    backgroundColor: '#1a1a2e',
    scale: 2,
    useCORS: true,
  });

  const url = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = url;
  link.download = `duty-schedule-${format(new Date(), 'yyyy-MM-dd')}.png`;
  link.click();
}

function downloadBlob(content: string, type: string, filename: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
