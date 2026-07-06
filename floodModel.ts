import { useState, type FormEvent } from 'react';
import { useNavigate } from '../lib/router';
import {
  CloudRain,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Save,
  Info,
} from 'lucide-react';
import Layout from '../components/Layout';
import { getOrTrainModel, predict, getFeatureStats, getFeatureLabels } from '../lib/floodModel';
import { savePrediction } from '../lib/predictionService';
import { logger } from '../lib/logger';
import type { PredictionInput, PredictionResult } from '../types';
import { formatPercent, getRiskColor, getRiskDotColor, classNames } from '../lib/utils';

const featureStats = getFeatureStats();
const featureLabels = getFeatureLabels();

const featureConfigs: { key: keyof PredictionInput; unit: string; step: string; defaultValue: number }[] = [
  { key: 'rainfall_mm', unit: 'mm', step: '0.1', defaultValue: 50 },
  { key: 'river_level_m', unit: 'm', step: '0.01', defaultValue: 3.5 },
  { key: 'soil_moisture_pct', unit: '%', step: '1', defaultValue: 55 },
  { key: 'temperature_c', unit: '°C', step: '0.1', defaultValue: 22 },
  { key: 'humidity_pct', unit: '%', step: '1', defaultValue: 70 },
  { key: 'wind_speed_kmh', unit: 'km/h', step: '0.5', defaultValue: 15 },
  { key: 'pressure_hpa', unit: 'hPa', step: '0.1', defaultValue: 1010 },
  { key: 'elevation_m', unit: 'm', step: '1', defaultValue: 150 },
  { key: 'drainage_capacity', unit: '/100', step: '1', defaultValue: 45 },
  { key: 'urbanization_pct', unit: '%', step: '1', defaultValue: 35 },
];

function validateInput(input: PredictionInput): Record<string, string> {
  const errors: Record<string, string> = {};

  if (input.rainfall_mm < 0) errors.rainfall_mm = 'Rainfall cannot be negative';
  if (input.rainfall_mm > 500) errors.rainfall_mm = 'Rainfall seems unrealistic (>500mm)';
  if (input.river_level_m < 0) errors.river_level_m = 'River level cannot be negative';
  if (input.river_level_m > 30) errors.river_level_m = 'River level seems unrealistic (>30m)';
  if (input.soil_moisture_pct < 0 || input.soil_moisture_pct > 100) errors.soil_moisture_pct = 'Must be 0-100';
  if (input.temperature_c < -50 || input.temperature_c > 60) errors.temperature_c = 'Temperature out of range';
  if (input.humidity_pct < 0 || input.humidity_pct > 100) errors.humidity_pct = 'Must be 0-100';
  if (input.wind_speed_kmh < 0) errors.wind_speed_kmh = 'Wind speed cannot be negative';
  if (input.wind_speed_kmh > 300) errors.wind_speed_kmh = 'Wind speed seems unrealistic';
  if (input.pressure_hpa < 800 || input.pressure_hpa > 1100) errors.pressure_hpa = 'Pressure out of range';
  if (input.elevation_m < 0) errors.elevation_m = 'Elevation cannot be negative';
  if (input.drainage_capacity < 0 || input.drainage_capacity > 100) errors.drainage_capacity = 'Must be 0-100';
  if (input.urbanization_pct < 0 || input.urbanization_pct > 100) errors.urbanization_pct = 'Must be 0-100';

  return errors;
}

export default function PredictPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState<PredictionInput>(() => {
    const defaults: Partial<PredictionInput> = {};
    for (const cfg of featureConfigs) {
      defaults[cfg.key] = cfg.defaultValue;
    }
    return defaults as PredictionInput;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof PredictionInput, value: string) => {
    const num = parseFloat(value);
    setInput((prev) => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handlePredict = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSaved(false);

    const validationErrors = validateInput(input);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    logger.info('Running prediction', input);

    try {
      const model = getOrTrainModel();
      const prediction = predict(input, model);
      setResult(prediction);
      logger.info('Prediction complete', { probability: prediction.probability, risk_level: prediction.risk_level });
    } catch (err) {
      logger.error('Prediction failed', err);
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      await savePrediction(input, result);
      setSaved(true);
      logger.info('Prediction saved to database');
    } catch (err) {
      logger.error('Save failed', err);
      setError(err instanceof Error ? err.message : 'Failed to save prediction');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const defaults: Partial<PredictionInput> = {};
    for (const cfg of featureConfigs) {
      defaults[cfg.key] = cfg.defaultValue;
    }
    setInput(defaults as PredictionInput);
    setResult(null);
    setErrors({});
    setError(null);
    setSaved(false);
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">New Flood Prediction</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter weather and environmental data to predict flood risk probability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card p-6 animate-slide-up">
          <form onSubmit={handlePredict} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featureConfigs.map((cfg) => (
                <div key={cfg.key}>
                  <label className="label" htmlFor={cfg.key}>
                    {featureLabels[cfg.key]}
                  </label>
                  <div className="relative">
                    <input
                      id={cfg.key}
                      type="number"
                      step={cfg.step}
                      value={input[cfg.key]}
                      onChange={(e) => handleChange(cfg.key, e.target.value)}
                      className={classNames('input pr-12', errors[cfg.key] && 'input-error')}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                      {cfg.unit}
                    </span>
                  </div>
                  {errors[cfg.key] && (
                    <p className="mt-1 text-xs text-error-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors[cfg.key]}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    Typical: {featureStats[cfg.key].mean}
                  </p>
                </div>
              ))}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-error-50 border border-error-200 px-3.5 py-3 text-sm text-error-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Predicting...
                  </>
                ) : (
                  <>
                    <CloudRain className="w-4 h-4" />
                    Predict Flood Risk
                  </>
                )}
              </button>
              <button type="button" onClick={handleReset} className="btn-secondary">
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {result ? (
            <div className="card p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Prediction Result</h3>
                <span className={classNames('badge capitalize', getRiskColor(result.risk_level))}>
                  <span className={classNames('w-1.5 h-1.5 rounded-full', getRiskDotColor(result.risk_level))} />
                  {result.risk_level} risk
                </span>
              </div>

              {/* Probability gauge */}
              <div className="mb-6">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Flood Probability</span>
                  <span className="text-3xl font-bold text-gray-900">{formatPercent(result.probability)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${result.probability * 100}%`,
                      backgroundColor: result.probability < 0.25 ? '#10b981' : result.probability < 0.5 ? '#f59e0b' : result.probability < 0.75 ? '#f97316' : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-gray-400">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Confidence */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-600">Model Confidence</span>
                  <span className="text-sm font-semibold text-gray-900">{formatPercent(result.confidence)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all duration-700"
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
              </div>

              {/* Top factors */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Top Contributing Factors</h4>
                <div className="space-y-2.5">
                  {result.top_factors.map((factor, i) => (
                    <div key={factor.feature} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-400 w-5">{i + 1}</span>
                      <span className="text-sm text-gray-700 flex-1">{factor.label}</span>
                      <div className="flex-1 max-w-[100px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-400 rounded-full"
                          style={{ width: `${factor.contribution * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">
                        {factor.value.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {saved ? (
                  <div className="flex-1 flex items-center justify-center gap-2 text-sm text-success-600 font-medium bg-success-50 rounded-lg px-4 py-2.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved to history
                  </div>
                ) : (
                  <button onClick={handleSave} disabled={saving} className="btn-secondary flex-1">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save to History
                      </>
                    )}
                  </button>
                )}
                <button onClick={() => navigate('/history')} className="btn-ghost">
                  View History
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-6 animate-fade-in">
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 mb-3">
                  <Info className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">Ready to predict</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Fill in the weather and environmental data on the left, then click "Predict Flood Risk" to get your result.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
