import pricingData from "./pricing.json";

export interface ModelSpec {
  id: string;
  provider: string;
  displayName: string;
  class: "frontier" | "small" | string;
  encoding: string;
  inputPricePerMTok: number;
  outputPricePerMTok: number;
  energyPerTokenWh: number;
  ttftMs: number;
  tokensPerSecond: number;
}

export interface EnvironmentConfig {
  pue: number;
  wueOnSiteLPerKWh: number;
  wueElectricityLPerKWh: number;
  co2IntensityGPerKWh: number;
  source: string;
}

export const MODELS: ModelSpec[] = pricingData.models as ModelSpec[];
export const ENV: EnvironmentConfig = pricingData.environment as EnvironmentConfig;

export function getModel(id: string): ModelSpec | undefined {
  return MODELS.find((m) => m.id === id);
}

export interface MetricsInput {
  model: ModelSpec;
  inputTokens: number;
  outputTokens: number;
}

export interface MetricsResult {
  model: ModelSpec;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** Cost in USD */
  costUsd: number;
  inputCostUsd: number;
  outputCostUsd: number;
  /** Energy in Wh (at the chip) */
  rawEnergyWh: number;
  /** Energy in Wh accounting for datacenter PUE */
  facilityEnergyWh: number;
  /** Water in mL */
  waterMl: number;
  /** CO2e in grams */
  co2eG: number;
  /** Time to first token, ms */
  ttftMs: number;
  /** End-to-end latency, ms */
  e2eLatencyMs: number;
}

/**
 * Compute all metrics for a single prompt against a single model.
 *
 * Methodology:
 * - Cost: (inputTokens/1M * inputPrice) + (outputTokens/1M * outputPrice)
 * - Energy: tokens * Wh-per-token (per Jegham et al. 2025 empirical per-token
 *   energy estimates by model class).
 * - Facility energy: rawEnergy * PUE.
 * - Water (mL): facilityEnergyKWh * (WUE_onsite + WUE_electricity) * 1000.
 *   Defaults reflect U.S. datacenter averages.
 * - CO2e (g): facilityEnergyKWh * grid carbon intensity (gCO2/kWh).
 * - Latency: TTFT (model class baseline) + outputTokens / tokensPerSecond.
 */
export function computeMetrics({ model, inputTokens, outputTokens }: MetricsInput): MetricsResult {
  const inputCostUsd = (inputTokens / 1_000_000) * model.inputPricePerMTok;
  const outputCostUsd = (outputTokens / 1_000_000) * model.outputPricePerMTok;
  const costUsd = inputCostUsd + outputCostUsd;

  const totalTokens = inputTokens + outputTokens;
  const rawEnergyWh = totalTokens * model.energyPerTokenWh;
  const facilityEnergyWh = rawEnergyWh * ENV.pue;
  const facilityEnergyKWh = facilityEnergyWh / 1000;

  const waterL = facilityEnergyKWh * (ENV.wueOnSiteLPerKWh + ENV.wueElectricityLPerKWh);
  const waterMl = waterL * 1000;

  const co2eG = facilityEnergyKWh * ENV.co2IntensityGPerKWh;

  const ttftMs = inputTokens > 0 ? model.ttftMs : 0;
  const e2eLatencyMs = totalTokens > 0 ? (ttftMs + (outputTokens / model.tokensPerSecond) * 1000) : 0;

  return {
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    costUsd,
    inputCostUsd,
    outputCostUsd,
    rawEnergyWh,
    facilityEnergyWh,
    waterMl,
    co2eG,
    ttftMs,
    e2eLatencyMs,
  };
}

export function formatUsd(v: number): string {
  if (v === 0) return "$0.00";
  if (v < 0.0001) return `$${v.toExponential(2)}`;
  if (v < 0.01) return `$${v.toFixed(5)}`;
  if (v < 1) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}

export function formatNumber(v: number, digits = 2): string {
  if (!isFinite(v)) return "—";
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return v.toFixed(digits);
}