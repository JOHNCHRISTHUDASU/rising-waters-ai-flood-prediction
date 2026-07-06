import { useEffect, useState } from 'react';
import { Link } from '../lib/router';
import {
  CloudRain,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowRight,
  Loader2,
  Brain,
  ShieldCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Layout from '../components/Layout';
import { useAuth } from '../lib/auth';
import { fetchPredictions, getPredictionStats } from '../lib/predictionService';
import { getOrTrainModel } from '../lib/floodModel';
import { logger } from '../lib/logger';
import type { PredictionRecord } from '../types';
import { formatPercent, getRiskColor, getRiskDotColor, classNames } from '../lib/utils';

const RISK_COLORS: Record<string, string> = {
  low: '#10b981',
  moderate: '#f59e0b',
  high: '#f97316',
  extreme: '#ef4444',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [stats, setStats] = useState<{ total: number; byRisk: Record<string, number>; avgProbability: number } | null>(null);
  const [modelTrained, setModelTrained] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        logger.info('Dashboard loading');
        const model = getOrTrainModel();
        setModelTrained(model.metrics.trained);
        logger.info('Model ready', { accuracy: model.metrics.accuracy });

        const [preds, statData] = await Promise.all([
          fetchPredictions(50),
          getPredictionStats(),
        ]);
        setPredictions(preds);
        setStats(statData);
      } catch (err) {
        logger.error('Dashboard load failed', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-gray-500">Loading dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="card p-6 border-error-200 bg-error-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-error-900">Failed to load dashboard</h3>
              <p className="text-sm text-error-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const recentPredictions = predictions.slice(0, 5);
  const chartData = [...predictions].reverse().map((p) => ({
    date: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    probability: p.flood_probability * 100,
  }));

  const pieData = stats
    ? Object.entries(stats.byRisk)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back, {user?.email?.split('@')[0] ?? 'user'}. Here's your flood prediction overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50">
              <CloudRain className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">Total Predictions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats?.total ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">All-time predictions made</p>
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-50">
              <TrendingUp className="w-5 h-5 text-accent-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">Avg Flood Probability</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPercent(stats?.avgProbability ?? 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Across all predictions</p>
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-50">
              <AlertTriangle className="w-5 h-5 text-warning-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">High Risk Alerts</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(stats?.byRisk.high ?? 0) + (stats?.byRisk.extreme ?? 0)}
          </p>
          <p className="text-xs text-gray-500 mt-1">High + extreme risk predictions</p>
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50">
              <Brain className="w-5 h-5 text-success-600" />
            </div>
            <span className="text-xs font-medium text-gray-400">Model Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={classNames('w-2 h-2 rounded-full', modelTrained ? 'bg-success-500' : 'bg-gray-400')} />
            <p className="text-lg font-bold text-gray-900">{modelTrained ? 'Trained' : 'Untrained'}</p>
          </div>
          <p className="text-xs text-gray-500 mt-1">AI model ready for predictions</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Flood Probability Trend</h3>
              <p className="text-xs text-gray-500">Recent prediction history</p>
            </div>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="probGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Flood Probability']}
                />
                <Area
                  type="monotone"
                  dataKey="probability"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#probGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
              No predictions yet. Make your first prediction to see trends.
            </div>
          )}
        </div>

        <div className="card p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Risk Distribution</h3>
              <p className="text-xs text-gray-500">By risk level</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={RISK_COLORS[entry.name] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value: string) => <span className="text-xs text-gray-600 capitalize">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
              No data to display
            </div>
          )}
        </div>
      </div>

      {/* Recent predictions */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Recent Predictions</h3>
            <p className="text-xs text-gray-500">Your latest flood risk assessments</p>
          </div>
          <Link to="/history" className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentPredictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2.5 px-3">Date</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2.5 px-3">Rainfall</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2.5 px-3">River Level</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2.5 px-3">Probability</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2.5 px-3">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPredictions.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-3 text-sm text-gray-600">
                      {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 text-sm text-gray-600">{p.rainfall_mm} mm</td>
                    <td className="py-3 px-3 text-sm text-gray-600">{p.river_level_m} m</td>
                    <td className="py-3 px-3 text-sm font-medium text-gray-900">{formatPercent(p.flood_probability)}</td>
                    <td className="py-3 px-3">
                      <span className={classNames('badge capitalize', getRiskColor(p.risk_level))}>
                        <span className={classNames('w-1.5 h-1.5 rounded-full', getRiskDotColor(p.risk_level))} />
                        {p.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">No predictions yet</p>
            <p className="text-xs text-gray-500 mt-1 mb-4">Start by making your first flood risk prediction</p>
            <Link to="/predict" className="btn-primary inline-flex">
              <CloudRain className="w-4 h-4" />
              Make a Prediction
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
