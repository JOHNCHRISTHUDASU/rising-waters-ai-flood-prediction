import type {
  PredictionInput,
  PredictionResult,
  ModelMetrics,
  TrainingHistoryPoint,
  FeatureImportance,
  FactorContribution,
} from '../types';

const FEATURE_LABELS: Record<keyof PredictionInput, string> = {
  rainfall_mm: 'Rainfall (mm)',
  river_level_m: 'River Level (m)',
  soil_moisture_pct: 'Soil Moisture (%)',
  temperature_c: 'Temperature (°C)',
  humidity_pct: 'Humidity (%)',
  wind_speed_kmh: 'Wind Speed (km/h)',
  pressure_hpa: 'Pressure (hPa)',
  elevation_m: 'Elevation (m)',
  drainage_capacity: 'Drainage Capacity',
  urbanization_pct: 'Urbanization (%)',
};

const FEATURE_STATS: Record<keyof PredictionInput, { mean: number; std: number; min: number; max: number }> = {
  rainfall_mm: { mean: 45, std: 35, min: 0, max: 200 },
  river_level_m: { mean: 3.5, std: 2, min: 0.5, max: 12 },
  soil_moisture_pct: { mean: 50, std: 20, min: 0, max: 100 },
  temperature_c: { mean: 20, std: 8, min: -5, max: 45 },
  humidity_pct: { mean: 65, std: 15, min: 20, max: 100 },
  wind_speed_kmh: { mean: 15, std: 8, min: 0, max: 60 },
  pressure_hpa: { mean: 1013, std: 10, min: 980, max: 1040 },
  elevation_m: { mean: 200, std: 300, min: 0, max: 1500 },
  drainage_capacity: { mean: 50, std: 20, min: 0, max: 100 },
  urbanization_pct: { mean: 40, std: 25, min: 0, max: 100 },
};

const FEATURE_ORDER: (keyof PredictionInput)[] = [
  'rainfall_mm',
  'river_level_m',
  'soil_moisture_pct',
  'temperature_c',
  'humidity_pct',
  'wind_speed_kmh',
  'pressure_hpa',
  'elevation_m',
  'drainage_capacity',
  'urbanization_pct',
];

const STORAGE_KEY = 'rising_waters_model_v1';

interface ModelWeights {
  weights: number[];
  bias: number;
  metrics: ModelMetrics;
  trainingHistory: TrainingHistoryPoint[];
  featureImportance: FeatureImportance[];
  trainedAt: string;
}

function sigmoid(z: number): number {
  if (z >= 0) {
    return 1 / (1 + Math.exp(-z));
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function normalize(value: number, key: keyof PredictionInput): number {
  const stats = FEATURE_STATS[key];
  return (value - stats.mean) / (stats.std || 1);
}

function generateSyntheticSample(): { input: number[]; label: number } {
  const input: number[] = [];
  const rawValues: PredictionInput = {
    rainfall_mm: 0,
    river_level_m: 0,
    soil_moisture_pct: 0,
    temperature_c: 0,
    humidity_pct: 0,
    wind_speed_kmh: 0,
    pressure_hpa: 0,
    elevation_m: 0,
    drainage_capacity: 0,
    urbanization_pct: 0,
  };

  for (const key of FEATURE_ORDER) {
    const stats = FEATURE_STATS[key];
    const value = stats.min + Math.random() * (stats.max - stats.min);
    rawValues[key] = value;
    input.push(normalize(value, key));
  }

  let floodScore = 0;
  floodScore += rawValues.rainfall_mm * 0.025;
  floodScore += rawValues.river_level_m * 0.18;
  floodScore += rawValues.soil_moisture_pct * 0.012;
  floodScore += rawValues.humidity_pct * 0.005;
  floodScore -= rawValues.temperature_c * 0.008;
  floodScore -= rawValues.pressure_hpa > 1013 ? (rawValues.pressure_hpa - 1013) * 0.03 : 0;
  floodScore += rawValues.pressure_hpa < 1000 ? (1000 - rawValues.pressure_hpa) * 0.04 : 0;
  floodScore -= rawValues.elevation_m * 0.003;
  floodScore -= rawValues.drainage_capacity * 0.015;
  floodScore += rawValues.urbanization_pct * 0.008;
  floodScore += rawValues.wind_speed_kmh * 0.003;

  const noise = (Math.random() - 0.5) * 2;
  floodScore += noise;
  const label = floodScore > 5 ? 1 : 0;

  return { input, label };
}

function generateTrainingData(count: number): { inputs: number[][]; labels: number[] } {
  const inputs: number[][] = [];
  const labels: number[] = [];
  for (let i = 0; i < count; i++) {
    const sample = generateSyntheticSample();
    inputs.push(sample.input);
    labels.push(sample.label);
  }
  return { inputs, labels };
}

function trainModel(
  inputs: number[][],
  labels: number[],
  epochs: number,
  learningRate: number,
): { weights: number[]; bias: number; history: TrainingHistoryPoint[] } {
  const numFeatures = inputs[0].length;
  const weights = new Array(numFeatures).fill(0);
  let bias = 0;
  const history: TrainingHistoryPoint[] = [];

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(numFeatures).fill(0);
    let gradB = 0;
    let totalLoss = 0;
    let correct = 0;

    for (let i = 0; i < inputs.length; i++) {
      const z = bias + inputs[i].reduce((sum, x, j) => sum + x * weights[j], 0);
      const pred = sigmoid(z);
      const error = pred - labels[i];

      for (let j = 0; j < numFeatures; j++) {
        gradW[j] += error * inputs[i][j];
      }
      gradB += error;

      totalLoss += labels[i] === 1 ? -Math.log(pred + 1e-9) : -Math.log(1 - pred + 1e-9);
      if ((pred >= 0.5 ? 1 : 0) === labels[i]) correct++;
    }

    const n = inputs.length;
    for (let j = 0; j < numFeatures; j++) {
      weights[j] -= (learningRate * gradW[j]) / n;
    }
    bias -= (learningRate * gradB) / n;

    const avgLoss = totalLoss / n;
    const accuracy = correct / n;

    if (epoch % 5 === 0 || epoch === epochs - 1) {
      history.push({ epoch: epoch + 1, loss: avgLoss, accuracy });
    }
  }

  return { weights, bias, history };
}

function evaluateModel(
  weights: number[],
  bias: number,
  inputs: number[][],
  labels: number[],
): ModelMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  const probabilities: number[] = [];
  const actualLabels: number[] = [];

  for (let i = 0; i < inputs.length; i++) {
    const z = bias + inputs[i].reduce((sum, x, j) => sum + x * weights[j], 0);
    const pred = sigmoid(z);
    const predicted = pred >= 0.5 ? 1 : 0;
    probabilities.push(pred);
    actualLabels.push(labels[i]);

    if (predicted === 1 && labels[i] === 1) tp++;
    else if (predicted === 1 && labels[i] === 0) fp++;
    else if (predicted === 0 && labels[i] === 0) tn++;
    else fn++;
  }

  const accuracy = (tp + tn) / (tp + fp + tn + fn);
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  let auc = 0;
  const sorted = probabilities.map((p, i) => ({ p, label: actualLabels[i] })).sort((a, b) => b.p - a.p);
  let posCount = 0, negCount = 0, rankSum = 0;
  for (const item of sorted) {
    if (item.label === 1) posCount++;
    else negCount++;
  }
  if (posCount > 0 && negCount > 0) {
    let rank = 0;
    for (const item of sorted) {
      rank++;
      if (item.label === 1) rankSum += rank;
    }
    auc = (rankSum - (posCount * (posCount + 1)) / 2) / (posCount * negCount);
  }

  const lastLoss = sorted.reduce((sum, item) => {
    return sum + (item.label === 1 ? -Math.log(item.p + 1e-9) : -Math.log(1 - item.p + 1e-9));
  }, 0) / sorted.length;

  return {
    accuracy,
    precision,
    recall,
    f1Score,
    auc: Math.max(0, Math.min(1, auc)),
    loss: lastLoss,
    epochs: 0,
    trained: true,
    confusionMatrix: {
      truePositive: tp,
      falsePositive: fp,
      trueNegative: tn,
      falseNegative: fn,
    },
  };
}

function computeFeatureImportance(weights: number[]): FeatureImportance[] {
  const absWeights = weights.map((w, i) => ({
    feature: FEATURE_ORDER[i],
    label: FEATURE_LABELS[FEATURE_ORDER[i]],
    importance: Math.abs(w),
  }));
  const total = absWeights.reduce((sum, f) => sum + f.importance, 0) || 1;
  return absWeights
    .map((f) => ({ ...f, importance: f.importance / total }))
    .sort((a, b) => b.importance - a.importance);
}

export function trainFloodModel(epochs = 200, learningRate = 0.1, sampleCount = 1000): ModelWeights {
  const trainData = generateTrainingData(sampleCount);
  const testData = generateTrainingData(Math.floor(sampleCount * 0.3));

  const { weights, bias, history } = trainModel(trainData.inputs, trainData.labels, epochs, learningRate);
  const metrics = evaluateModel(weights, bias, testData.inputs, testData.labels);
  metrics.epochs = epochs;
  const featureImportance = computeFeatureImportance(weights);

  return {
    weights,
    bias,
    metrics,
    trainingHistory: history,
    featureImportance,
    trainedAt: new Date().toISOString(),
  };
}

export function loadModel(): ModelWeights | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ModelWeights;
  } catch {
    return null;
  }
}

export function saveModel(model: ModelWeights): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
  } catch (err) {
    console.error('Failed to save model:', err);
  }
}

export function getOrTrainModel(): ModelWeights {
  const existing = loadModel();
  if (existing && existing.metrics.trained) {
    return existing;
  }
  const model = trainFloodModel();
  saveModel(model);
  return model;
}

export function retrainModel(epochs?: number, learningRate?: number): ModelWeights {
  const model = trainFloodModel(epochs, learningRate);
  saveModel(model);
  return model;
}

export function predict(input: PredictionInput, model: ModelWeights): PredictionResult {
  const normalized = FEATURE_ORDER.map((key) => normalize(input[key], key));
  const z = model.bias + normalized.reduce((sum, x, j) => sum + x * model.weights[j], 0);
  const probability = sigmoid(z);

  let risk_level: PredictionResult['risk_level'];
  if (probability < 0.25) risk_level = 'low';
  else if (probability < 0.5) risk_level = 'moderate';
  else if (probability < 0.75) risk_level = 'high';
  else risk_level = 'extreme';

  const confidence = Math.abs(probability - 0.5) * 2;

  const contributions: FactorContribution[] = FEATURE_ORDER.map((key, i) => ({
    feature: key,
    label: FEATURE_LABELS[key],
    weight: model.weights[i],
    value: input[key],
    contribution: normalized[i] * model.weights[i],
  }));

  const top_factors = contributions
    .map((c) => ({ ...c, contribution: Math.abs(c.contribution) }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 5);

  return {
    probability,
    risk_level,
    confidence,
    top_factors,
  };
}

export function getFeatureLabels(): Record<keyof PredictionInput, string> {
  return FEATURE_LABELS;
}

export function getFeatureStats(): Record<keyof PredictionInput, { min: number; max: number; mean: number }> {
  return FEATURE_STATS;
}

export function getFeatureOrder(): (keyof PredictionInput)[] {
  return FEATURE_ORDER;
}
