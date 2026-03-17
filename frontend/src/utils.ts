import type { PerformanceLevel } from './types';

export function getPerformanceColor(performance: PerformanceLevel): string {
  const colors: Record<PerformanceLevel, string> = {
    Perfect: '#00ff00',
    Excellent: '#22c55e',
    Good: '#fbbf24',
    Mid: '#fb923c',
    BelowAvg: '#f87171',
    Poor: '#dc2626',
    Inactive: '#374151'
  };
  return colors[performance] || '#9ca3af';
}

export function getHeatmapColor(fame: number): string {
  if (fame === 0) return '#1f2937';
  if (fame < 2000) return '#dc2626';
  if (fame < 2500) return '#f87171';
  if (fame < 2700) return '#fb923c';
  if (fame < 3000) return '#fbbf24';
  if (fame < 3600) return '#22c55e';
  return '#00ff00';
}

export function formatNumber(num: number): string {
  return num.toLocaleString();
}

export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}
