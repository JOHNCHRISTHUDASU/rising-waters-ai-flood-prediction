import { useEffect, useState } from 'react';
import {
  History as HistoryIcon,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  FileJson,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import Layout from '../components/Layout';
import { fetchPredictions, deletePrediction } from '../lib/predictionService';
import { logger } from '../lib/logger';
import type { PredictionRecord } from '../types';
import { formatDate, formatPercent, getRiskColor, getRiskDotColor, exportToCSV, exportToJSON, classNames } from '../lib/utils';

export default function HistoryPage() {
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadPredictions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPredictions(200);
      setPredictions(data);
    } catch (err) {
      logger.error('Failed to load history', err);
      setError(err instanceof Error ? err.message : 'Failed to load prediction history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deletePrediction(id);
      setPredictions((prev) => prev.filter((p) => p.id !== id));
      setDeleteId(null);
      logger.info('Prediction deleted from history', { id });
    } catch (err) {
      logger.error('Delete failed', err);
      setError(err instanceof Error ? err.message : 'Failed to delete prediction');
    }
  };

  const filtered = predictions.filter((p) => {
    const matchesSearch = !search ||
      p.rainfall_mm.toString().includes(search) ||
      p.river_level_m.toString().includes(search) ||
      p.risk_level.toLowerCase().includes(search.toLowerCase());
    const matchesRisk = riskFilter === 'all' || p.risk_level === riskFilter;
    return matchesSearch && matchesRisk;
  });

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prediction History</h1>
            <p className="text-sm text-gray-500 mt-1">
              {predictions.length} prediction{predictions.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          {predictions.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="btn-secondary"
              >
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-3 h-3" />
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 card p-1.5 z-20 shadow-lg animate-fade-in">
                    <button
                      onClick={() => { exportToCSV(filtered); setShowExportMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-success-600" />
                      Export as CSV
                    </button>
                    <button
                      onClick={() => { exportToJSON(filtered); setShowExportMenu(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <FileJson className="w-4 h-4 text-primary-600" />
                      Export as JSON
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-error-50 border border-error-200 px-3.5 py-3 text-sm text-error-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      {predictions.length > 0 && (
        <div className="card p-4 mb-4 animate-slide-up">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
                placeholder="Search by rainfall, river level, or risk level..."
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="input pl-10 pr-8 appearance-none cursor-pointer"
              >
                <option value="all">All Risk Levels</option>
                <option value="low">Low Risk</option>
                <option value="moderate">Moderate Risk</option>
                <option value="high">High Risk</option>
                <option value="extreme">Extreme Risk</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-gray-500">Loading history...</p>
          </div>
        </div>
      ) : filtered.length > 0 ? (
        <div className="card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Rainfall</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">River</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 hidden sm:table-cell">Soil</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 hidden md:table-cell">Temp</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 hidden md:table-cell">Humidity</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Probability</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Risk</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">{formatDate(p.created_at)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.rainfall_mm} mm</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.river_level_m} m</td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden sm:table-cell">{p.soil_moisture_pct}%</td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{p.temperature_c}°C</td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{p.humidity_pct}%</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatPercent(p.flood_probability)}</td>
                    <td className="py-3 px-4">
                      <span className={classNames('badge capitalize', getRiskColor(p.risk_level))}>
                        <span className={classNames('w-1.5 h-1.5 rounded-full', getRiskDotColor(p.risk_level))} />
                        {p.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {deleteId === p.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="text-xs font-medium text-white bg-error-600 hover:bg-error-700 px-2.5 py-1 rounded-md transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteId(null)}
                            className="text-xs font-medium text-gray-600 hover:bg-gray-100 px-2.5 py-1 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="text-gray-400 hover:text-error-600 transition-colors p-1.5 rounded-md hover:bg-error-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center animate-fade-in">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mx-auto mb-3">
            <HistoryIcon className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900">
            {predictions.length === 0 ? 'No predictions yet' : 'No predictions match your filters'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {predictions.length === 0
              ? 'Make your first flood risk prediction to see it here'
              : 'Try adjusting your search or filter criteria'}
          </p>
        </div>
      )}
    </Layout>
  );
}
