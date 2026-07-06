import type { PredictionRecord } from '../types';

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'moderate': return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'extreme': return 'text-red-600 bg-red-50 border-red-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getRiskDotColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'low': return 'bg-emerald-500';
    case 'moderate': return 'bg-amber-500';
    case 'high': return 'bg-orange-500';
    case 'extreme': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

export function exportToCSV(records: PredictionRecord[]): void {
  const headers = [
    'Date',
    'Rainfall (mm)',
    'River Level (m)',
    'Soil Moisture (%)',
    'Temperature (°C)',
    'Humidity (%)',
    'Wind Speed (km/h)',
    'Pressure (hPa)',
    'Elevation (m)',
    'Drainage Capacity',
    'Urbanization (%)',
    'Flood Probability',
    'Risk Level',
    'Confidence',
  ];

  const rows = records.map((r) => [
    formatDate(r.created_at),
    r.rainfall_mm,
    r.river_level_m,
    r.soil_moisture_pct,
    r.temperature_c,
    r.humidity_pct,
    r.wind_speed_kmh,
    r.pressure_hpa,
    r.elevation_m,
    r.drainage_capacity,
    r.urbanization_pct,
    `${(r.flood_probability * 100).toFixed(1)}%`,
    r.risk_level,
    `${(r.confidence_score * 100).toFixed(1)}%`,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => {
      const str = String(cell);
      if (str.includes(',') || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flood-predictions-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(records: PredictionRecord[]): void {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flood-predictions-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
