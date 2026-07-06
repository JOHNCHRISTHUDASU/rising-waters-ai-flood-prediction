import { supabase } from './supabase';
import { logger } from './logger';
import type { PredictionInput, PredictionResult, PredictionRecord } from '../types';

export async function savePrediction(
  input: PredictionInput,
  result: PredictionResult,
): Promise<PredictionRecord | null> {
  const { data, error } = await supabase
    .from('flood_predictions')
    .insert({
      rainfall_mm: input.rainfall_mm,
      river_level_m: input.river_level_m,
      soil_moisture_pct: input.soil_moisture_pct,
      temperature_c: input.temperature_c,
      humidity_pct: input.humidity_pct,
      wind_speed_kmh: input.wind_speed_kmh,
      pressure_hpa: input.pressure_hpa,
      elevation_m: input.elevation_m,
      drainage_capacity: input.drainage_capacity,
      urbanization_pct: input.urbanization_pct,
      flood_probability: result.probability,
      risk_level: result.risk_level,
      confidence_score: result.confidence,
      top_factors: result.top_factors,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to save prediction', error);
    throw new Error(`Failed to save prediction: ${error.message}`);
  }

  logger.info('Prediction saved', { id: data.id, risk_level: result.risk_level });
  return data as PredictionRecord;
}

export async function fetchPredictions(limit = 100): Promise<PredictionRecord[]> {
  const { data, error } = await supabase
    .from('flood_predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch predictions', error);
    throw new Error(`Failed to fetch predictions: ${error.message}`);
  }

  return (data ?? []) as PredictionRecord[];
}

export async function deletePrediction(id: string): Promise<void> {
  const { error } = await supabase
    .from('flood_predictions')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Failed to delete prediction', error);
    throw new Error(`Failed to delete prediction: ${error.message}`);
  }

  logger.info('Prediction deleted', { id });
}

export async function getPredictionStats(): Promise<{
  total: number;
  byRisk: Record<string, number>;
  avgProbability: number;
}> {
  const { data, error } = await supabase
    .from('flood_predictions')
    .select('risk_level, flood_probability');

  if (error) {
    logger.error('Failed to fetch prediction stats', error);
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }

  const records = data ?? [];
  const byRisk: Record<string, number> = { low: 0, moderate: 0, high: 0, extreme: 0 };
  let totalProb = 0;

  for (const r of records) {
    byRisk[r.risk_level] = (byRisk[r.risk_level] ?? 0) + 1;
    totalProb += r.flood_probability;
  }

  return {
    total: records.length,
    byRisk,
    avgProbability: records.length > 0 ? totalProb / records.length : 0,
  };
}
