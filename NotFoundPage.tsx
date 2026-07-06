import { useEffect, useState } from 'react';
import {
  Brain,
  RefreshCw,
  Loader2,
  Target,
  Crosshair,
  TrendingUp,
  Layers,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import Layout from '../components/Layout';
import { getOrTrainModel, retrainModel } from '../lib/floodModel';
import { logger } from '../lib/logger';
import type { ModelMetrics, TrainingHistoryPoint, FeatureImportance } from '../types';
import { formatPercent, classNames } from '../lib/utils';

export default function ModelPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [history, setHistory] = useState<TrainingHistoryPoint[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [trainedAt, setTrainedAt] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  const loadModelData = () => {
    setLoading(true);
    try {
      const model = getOrTrainModel();
      setMetrics(model.metrics);
      setHistory(model.trainingHistory);
      setFeatureImportance(model.featureImportance);
      setTrainedAt(model.trainedAt);
      logger.info('Model data loaded', { accuracy: model.metrics.accuracy });
    } catch (err) {
      logger.error('Failed to load model', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelData();
  }, []);

  const handleRetrain = () => {
    setRetraining(true);
    setTimeout(() => {
      try {
        logger.info('Retraining model');
        const model = retrainModel(250, 0.08);
        setMetrics(model.metrics);
        setHistory(model.trainingHistory);
        setFeatureImportance(model.featureImportance);
        setTrainedAt(model.trainedAt);
        logger.info('Model retrained', { accuracy: model.metrics.accuracy });
      } catch (err) {
        logger.error('Retraining failed', err);
      } finally {
        setRetraining(false);
      }
    }, 100);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            <p className="text-sm text-gray-500">Loading model data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const metricCards = [
    { label: 'Accuracy', value: metrics?.accuracy ?? 0, icon: Target, color: 'primary' },
    { label: 'Precision', value: metrics?.precision ?? 0, icon: Crosshair, color: 'accent' },
    { label: 'Recall', value: metrics?.recall ?? 0, icon: TrendingUp, color: 'success' },
    { label: 'F1 Score', value: metrics?.f1Score ?? 0, icon: Layers, color: 'warning' },
  ];

  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
  };

  const confusionData = metrics ? [
    { name: 'True Positive', value: metrics.confusionMatrix.truePositive, fill: '#10b981' },
    { name: 'False Positive', value: metrics.confusionMatrix.falsePositive, fill: '#f87171' },
    { name: 'True Negative', value: metrics.confusionMatrix.trueNegative, fill: '#3b82f6' },
    { name: 'False Negative', value: metrics.confusionMatrix.falseNegative, fill: '#fbbf24' },
  ] : [];

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Model Performance</h1>
            <p className="text-sm text-gray-500 mt-1">
              AI model metrics, training history, and feature importance analysis
            </p>
          </div>
          <button onClick={handleRetrain} disabled={retraining} className="btn-primary">
            {retraining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Retraining...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Retrain Model
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model status banner */}
      <div className="card p-4 mb-6 animate-slide-up bg-gradient-to-r from-primary-50 to-accent-50 border-primary-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-600">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">Logistic Regression Model</span>
              <span className="badge bg-success-50 text-success-700 border-success-200">
                <CheckCircle2 className="w-3 h-3" />
                Active
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Trained on 1,000 synthetic samples with gradient descent optimization
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-4 h-4" />
            Last trained: {new Date(trainedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metricCards.map((m, i) => (
          <div key={m.label} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={classNames('flex items-center justify-center w-9 h-9 rounded-lg', colorMap[m.color])}>
                <m.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPercent(m.value)}</p>
            <p className="text-xs text-gray-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Training history */}
        <div className="card p-5 animate-slide-up">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Training History</h3>
            <p className="text-xs text-gray-500">Loss and accuracy over training epochs</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="epoch" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                formatter={(value: number, name: string) => [value.toFixed(4), name === 'loss' ? 'Loss' : 'Accuracy']}
              />
              <Line yAxisId="left" type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} name="loss" />
              <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={false} name="accuracy" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Confusion matrix */}
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Confusion Matrix</h3>
            <p className="text-xs text-gray-500">Model classification performance on test data</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={confusionData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={100} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                formatter={(value: number) => [value, 'Count']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {confusionData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Feature importance */}
      <div className="card p-5 animate-slide-up">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-900">Feature Importance</h3>
          <p className="text-xs text-gray-500">Relative contribution of each feature to flood risk prediction</p>
        </div>
        <div className="space-y-3">
          {featureImportance.map((f, i) => (
            <div key={f.feature} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-400 w-5">{i + 1}</span>
              <span className="text-sm text-gray-700 w-40 flex-shrink-0">{f.label}</span>
              <div className="flex-1 h-6 bg-gray-50 rounded-md overflow-hidden relative">
                <div
                  className="h-full rounded-md transition-all duration-700 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${f.importance * 100}%`,
                    backgroundColor: i === 0 ? '#2563eb' : i === 1 ? '#3b82f6' : i === 2 ? '#60a5fa' : '#93c5fd',
                    minWidth: '40px',
                  }}
                >
                  <span className="text-xs font-medium text-white">{formatPercent(f.importance, 1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="card p-5 animate-slide-up">
          <p className="text-xs text-gray-500 mb-1">AUC-ROC Score</p>
          <p className="text-xl font-bold text-gray-900">{formatPercent(metrics?.auc ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">Area under ROC curve</p>
        </div>
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
          <p className="text-xs text-gray-500 mb-1">Final Loss</p>
          <p className="text-xl font-bold text-gray-900">{(metrics?.loss ?? 0).toFixed(4)}</p>
          <p className="text-xs text-gray-400 mt-1">Binary cross-entropy</p>
        </div>
        <div className="card p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <p className="text-xs text-gray-500 mb-1">Training Epochs</p>
          <p className="text-xl font-bold text-gray-900">{metrics?.epochs ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">Gradient descent iterations</p>
        </div>
      </div>
    </Layout>
  );
}
