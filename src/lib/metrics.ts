import pricingData from "./pricing.json";
import factsData from "./facts.json";

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
  const e2eLatencyMs = totalTokens > 0 ? ttftMs + (outputTokens / model.tokensPerSecond) * 1000 : 0;

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

export interface RelatableFacts {
  costFact: string;
  waterFact: string;
}

/** Pick an item from an array using a numeric seed, rotating every 10 units. */
function pick<T>(arr: T[], seed: number): T {
  const idx = Math.floor(seed / 10) % arr.length;
  return arr[idx];
}

function replacePlaceholders(fact: string, val: number): string {
  if (!fact.includes("{n}")) return fact;

  let divisor = 1;
  let decimals = 0;

  // Cost map
  if (fact.includes("coffee")) divisor = 4;
  else if (fact.includes("pizza")) divisor = 2;
  else if (fact.includes("iTunes")) divisor = 1.29;
  else if (fact.includes("juices")) divisor = 3;
  else if (fact.includes("doughnuts")) divisor = 2;
  else if (fact.includes("ice cream")) divisor = 3;
  else if (fact.includes("Netflix")) divisor = 18;
  else if (fact.includes("ChatGPT Plus")) divisor = 20;
  else if (fact.includes("sushi")) divisor = 12;
  else if (fact.includes("Spotify")) divisor = 11;
  else if (fact.includes("meal-kit")) divisor = 15;
  else if (fact.includes("gym")) divisor = 30;
  else if (fact.includes("cinema")) divisor = 15;
  else if (fact.includes("mobile plan")) divisor = 10;
  else if (fact.includes("hostel")) divisor = 30;
  else if (fact.includes("wine")) divisor = 25;
  else if (fact.includes("AirPods")) divisor = 150;
  else if (fact.includes("Nike")) divisor = 200;
  else if (fact.includes("GoPro")) divisor = 500;
  else if (fact.includes("guitar")) divisor = 300;
  else if (fact.includes("flights") && divisor === 1) divisor = 250;
  else if (fact.includes("video games")) divisor = 70;
  else if (fact.includes("Coursera")) divisor = 120;
  else if (fact.includes("glamping")) divisor = 150;
  else if (fact.includes("suitcases")) divisor = 400;
  else if (fact.includes("printers")) divisor = 350;
  else if (fact.includes("MacBook")) {
    divisor = 1600;
    decimals = 1;
  } else if (fact.includes("scooter")) {
    divisor = 5000;
    decimals = 1;
  } else if (fact.includes("smartwatches")) divisor = 2000;
  else if (fact.includes("satellite internet")) divisor = 1200;
  else if (fact.includes("sofas")) divisor = 2500;
  else if (fact.includes("monitors")) divisor = 3500;
  else if (fact.includes("violins")) {
    divisor = 4000;
    decimals = 1;
  } else if (fact.includes("surfboard")) divisor = 1500;
  else if (fact.includes("telescopes")) {
    divisor = 7000;
    decimals = 1;
  } else if (fact.includes("knife sets")) divisor = 2000;
  else if (fact.includes("developer")) divisor = 1000;
  else if (fact.includes("co-working")) divisor = 3000;
  else if (fact.includes("Tesla")) {
    divisor = 50000;
    decimals = 1;
  } else if (fact.includes("college")) divisor = 2500;
  else if (fact.includes("flights")) divisor = 5000;
  else if (fact.includes("mortgage")) {
    divisor = 20000;
    decimals = 2;
  } else if (fact.includes("film production")) {
    divisor = 100000;
    decimals = 2;
  } else if (fact.includes("ER visits")) divisor = 1500;
  else if (fact.includes("homes")) divisor = 100;
  // Water map
  else if (fact.includes("water bottles")) divisor = 0.5;
  else if (fact.includes("houseplant")) divisor = 0.3;
  else if (fact.includes("glasses")) divisor = 0.25;
  else if (fact.includes("juice boxes")) divisor = 0.3;
  else if (fact.includes("showers")) divisor = 65;
  else if (fact.includes("drinking water") && fact.includes("people") && !fact.includes("supply"))
    divisor = 2;
  else if (fact.includes("buckets")) divisor = 10;
  else if (fact.includes("sunflower")) divisor = 1.5;
  else if (fact.includes("swimming pool") && fact.includes("%")) {
    divisor = 2500000 / 100;
    decimals = 4;
  } else if (fact.includes("pasta")) divisor = 5;
  else if (fact.includes("dogs")) divisor = 5;
  else if (fact.includes("hand-washing")) divisor = 7;
  else if (fact.includes("bathtub")) divisor = 150;
  else if (fact.includes("cars")) divisor = 120;
  else if (fact.includes("oak trees")) divisor = 450;
  else if (fact.includes("household")) divisor = 300;
  else if (fact.includes("alligators")) divisor = 500;
  else if (fact.includes("concrete")) divisor = 200;
  else if (fact.includes("kegs")) divisor = 8;
  else if (fact.includes("wheat")) {
    divisor = 500;
    decimals = 1;
  } else if (fact.includes("T-shirt")) divisor = 2500;
  else if (fact.includes("coffee beans")) divisor = 140;
  else if (fact.includes("cows")) divisor = 3500;
  else if (fact.includes("beef")) {
    divisor = 15000;
    decimals = 1;
  } else if (fact.includes("swimming pools") && !fact.includes("%")) {
    divisor = 2500;
    decimals = 1;
  } else if (fact.includes("corn")) divisor = 1000;
  else if (fact.includes("airline seats")) {
    divisor = 50000;
    decimals = 2;
  } else if (fact.includes("drinking water supply") && fact.includes("people")) {
    divisor = 2 * 365;
    decimals = 1;
  } else if (fact.includes("lakes")) divisor = 1000000;
  else if (fact.includes("fire truck")) divisor = 10000;
  else if (fact.includes("sailboats")) divisor = 500000;
  else if (fact.includes("swimming pools")) divisor = 2500;

  const nVal = val / divisor;
  const nStr =
    decimals === 0 ? Math.max(1, Math.round(nVal)).toLocaleString() : nVal.toFixed(decimals);
  return fact.replace("{n}", nStr);
}

export function generateRelatableFacts(
  monthlyCost: number,
  monthlyWaterMl: number,
): RelatableFacts {
  const monthlyWaterL = monthlyWaterMl / 1000;

  // ─── COST FACTS ────────────────────────────────────────────────────────────
  let costFact = "";

  if (monthlyCost <= 0) {
    costFact = factsData.costFacts.zero[0];
  } else if (monthlyCost < 1) {
    const pool = factsData.costFacts.under1;
    costFact = replacePlaceholders(pick(pool, monthlyCost * 1000), monthlyCost);
  } else if (monthlyCost < 10) {
    const pool = factsData.costFacts.under10;
    costFact = replacePlaceholders(pick(pool, monthlyCost * 100), monthlyCost);
  } else if (monthlyCost < 100) {
    const pool = factsData.costFacts.under100;
    costFact = replacePlaceholders(pick(pool, monthlyCost * 10), monthlyCost);
  } else if (monthlyCost < 1000) {
    const pool = factsData.costFacts.under1000;
    costFact = replacePlaceholders(pick(pool, monthlyCost), monthlyCost);
  } else if (monthlyCost < 10000) {
    const pool = factsData.costFacts.under10000;
    costFact = replacePlaceholders(pick(pool, monthlyCost / 10), monthlyCost);
  } else {
    const pool = factsData.costFacts.above10000;
    costFact = replacePlaceholders(pick(pool, monthlyCost / 100), monthlyCost);
  }

  // ─── WATER FACTS ───────────────────────────────────────────────────────────
  let waterFact = "";

  if (monthlyWaterL <= 0) {
    waterFact = factsData.waterFacts.zero[0];
  } else if (monthlyWaterL < 1) {
    const pool = factsData.waterFacts.under1;
    waterFact = replacePlaceholders(pick(pool, monthlyWaterL * 10000), monthlyWaterL);
  } else if (monthlyWaterL < 10) {
    const pool = factsData.waterFacts.under10;
    waterFact = replacePlaceholders(pick(pool, monthlyWaterL * 1000), monthlyWaterL);
  } else if (monthlyWaterL < 100) {
    const pool = factsData.waterFacts.under100;
    waterFact = replacePlaceholders(pick(pool, monthlyWaterL * 100), monthlyWaterL);
  } else if (monthlyWaterL < 1000) {
    const pool = factsData.waterFacts.under1000;
    waterFact = replacePlaceholders(pick(pool, monthlyWaterL * 10), monthlyWaterL);
  } else if (monthlyWaterL < 10000) {
    const pool = factsData.waterFacts.under10000;
    waterFact = replacePlaceholders(pick(pool, monthlyWaterL), monthlyWaterL);
  } else {
    const pool = factsData.waterFacts.above10000;
    waterFact = replacePlaceholders(pick(pool, monthlyWaterL / 100), monthlyWaterL);
  }

  return { costFact, waterFact };
}

/**
 * Generate a complete, markdown-formatted advisory report 100% locally.
 */
export function generateLocalAdvisorInsights(
  results: (MetricsResult & {
    monthlyCost: number;
    monthlyCo2: number;
    monthlyWater: number;
    facts: RelatableFacts;
  })[],
  callsPerMonth: number,
  outputTokens: number,
): string {
  if (results.length === 0) {
    return "No models benchmarked. Please select at least one model to generate insights.";
  }

  // Sort and select key metrics
  const sortedByCost = [...results].sort((a, b) => a.monthlyCost - b.monthlyCost);
  const cheapest = sortedByCost[0];
  const mostExpensive = sortedByCost[sortedByCost.length - 1];

  const sortedByLatency = [...results].sort((a, b) => a.e2eLatencyMs - b.e2eLatencyMs);
  const fastest = sortedByLatency[0];

  const sortedByCo2 = [...results].sort((a, b) => a.monthlyCo2 - b.monthlyCo2);
  const greenest = sortedByCo2[0];

  // Average values across the selected set
  const avgCost = results.reduce((sum, r) => sum + r.monthlyCost, 0) / results.length;
  const avgWaterL = results.reduce((sum, r) => sum + r.monthlyWater, 0) / results.length / 1000;
  const avgCo2G = results.reduce((sum, r) => sum + r.monthlyCo2, 0) / results.length;
  const avgEnergyWh =
    (results.reduce((sum, r) => sum + r.facilityEnergyWh, 0) / results.length) * callsPerMonth;

  // Recommendations builder
  const costRecs: string[] = [];
  if (avgCost > 100) {
    costRecs.push(...factsData.recommendations.highCost);
  } else {
    costRecs.push(...factsData.recommendations.general);
  }

  const ecoRecs: string[] = [];
  if (avgWaterL > 1000) {
    ecoRecs.push(...factsData.recommendations.highWater);
  }
  if (avgCo2G > 1000) {
    ecoRecs.push(...factsData.recommendations.highCarbon);
  }
  if (ecoRecs.length === 0) {
    ecoRecs.push(
      "Your environmental footprint is relatively small. You can keep it optimal by using smaller models or prompt caching.",
    );
  }

  // Savings math
  const monthlySavings = mostExpensive.monthlyCost - cheapest.monthlyCost;
  const savingsPercent =
    mostExpensive.monthlyCost > 0
      ? Math.round(
          ((mostExpensive.monthlyCost - cheapest.monthlyCost) / mostExpensive.monthlyCost) * 100,
        )
      : 0;

  let tradeOffText = "";
  if (results.length > 1) {
    tradeOffText = `Switching from the most expensive model (**${mostExpensive.model.displayName}**) to the cheapest (**${cheapest.model.displayName}**) could save you **${formatUsd(monthlySavings)}/month** (a **${savingsPercent}%** reduction in cost), while your latency will change from **${formatNumber(mostExpensive.e2eLatencyMs, 0)} ms** to **${formatNumber(cheapest.e2eLatencyMs, 0)} ms**.`;
  } else {
    tradeOffText = `You are evaluating a single model: **${cheapest.model.displayName}**. Add more models to perform side-by-side trade-off and optimization calculations.`;
  }

  // Draw 2 dynamic analogies based on the selected models
  const costAnalogy = cheapest.facts.costFact;
  const waterAnalogy = cheapest.facts.waterFact;

  // Let's calculate a dynamic carbon analogy
  const co2eKg = avgCo2G / 1000;
  let carbonAnalogy = "";
  if (co2eKg <= 0.01) {
    carbonAnalogy = `equivalent to keeping an LED lightbulb running for ${Math.round(co2eKg * 200)} minutes.`;
  } else if (co2eKg < 1) {
    carbonAnalogy = `equivalent to charging ${Math.round(co2eKg * 120)} smartphones.`;
  } else if (co2eKg < 10) {
    carbonAnalogy = `equivalent to driving ${formatNumber(co2eKg * 2.5, 1)} miles in an average gasoline car.`;
  } else {
    carbonAnalogy = `offset by ${formatNumber(co2eKg / 22, 2)} mature tree(s) absorbing carbon for a whole year.`;
  }

  return `### Cost vs. Performance Trade-off
- **Value Champion**: **${cheapest.model.displayName}** is the most cost-effective option at **${formatUsd(cheapest.monthlyCost)}/mo**.
- **Speed Leader**: **${fastest.model.displayName}** delivers responses in **${formatNumber(fastest.e2eLatencyMs, 0)} ms** on average.
- **Trade-off Analysis**: ${tradeOffText}

#### Actionable Optimization Checklist:
${costRecs.map((r) => `- ${r}`).join("\n")}

### Environmental Impact Assessment
- **Carbon Intensity**: **${greenest.model.displayName}** is the greenest model selected, emitting just **${formatNumber(greenest.monthlyCo2, 2)} g CO₂e/month**.
- **Total Portfolio Footprint**: Across your selections, average monthly resource demand is **${formatNumber(avgWaterL, 1)} Liters** of water, **${formatNumber(avgCo2G / 1000, 2)} kg CO₂e** greenhouse gases, and **${formatNumber(avgEnergyWh / 1000, 2)} kWh** of power.

#### Eco-Optimization Recommendations:
${ecoRecs.map((r) => `- ${r}`).join("\n")}

### Relatable Real-World Facts
- **Cost Aspect**: The cost of running **${cheapest.model.displayName}** is *${costAnalogy.replace(/^[^\s]+\s+/, "")}*
- **Water Consumption**: Keeping the datacenters cool for **${cheapest.model.displayName}** is *${waterAnalogy.replace(/^[^\s]+\s+/, "")}*
- **Carbon Footprint**: The greenhouse emissions of your average run are *${carbonAnalogy}*`;
}
