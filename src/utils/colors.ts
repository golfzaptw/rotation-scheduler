/**
 * Curated station color palette.
 * Each station gets a unique, rich color that's readable on dark backgrounds.
 * Colors cycle if there are more stations than palette entries.
 */

const STATION_COLORS = [
  { fg: 'hsl(172, 66%, 50%)', bg: 'hsla(172, 66%, 50%, 0.15)', name: 'Teal' },
  { fg: 'hsl(38, 92%, 55%)', bg: 'hsla(38, 92%, 55%, 0.15)', name: 'Amber' },
  { fg: 'hsl(262, 83%, 65%)', bg: 'hsla(262, 83%, 65%, 0.15)', name: 'Violet' },
  { fg: 'hsl(340, 82%, 60%)', bg: 'hsla(340, 82%, 60%, 0.15)', name: 'Rose' },
  { fg: 'hsl(142, 71%, 45%)', bg: 'hsla(142, 71%, 45%, 0.15)', name: 'Emerald' },
  { fg: 'hsl(200, 95%, 55%)', bg: 'hsla(200, 95%, 55%, 0.15)', name: 'Blue' },
  { fg: 'hsl(25, 95%, 55%)', bg: 'hsla(25, 95%, 55%, 0.15)', name: 'Orange' },
  { fg: 'hsl(290, 70%, 60%)', bg: 'hsla(290, 70%, 60%, 0.15)', name: 'Purple' },
  { fg: 'hsl(60, 70%, 50%)', bg: 'hsla(60, 70%, 50%, 0.15)', name: 'Yellow' },
  { fg: 'hsl(185, 60%, 50%)', bg: 'hsla(185, 60%, 50%, 0.15)', name: 'Cyan' },
];

export function getStationColor(index: number) {
  const colorGroup = Math.floor(index / 7);
  return STATION_COLORS[colorGroup % STATION_COLORS.length];
}

export function getStationColorCount() {
  return STATION_COLORS.length;
}
