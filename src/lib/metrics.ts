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

export interface RelatableFacts {
  costFact: string;
  waterFact: string;
}

/** Pick an item from an array using a numeric seed, rotating every 10 units. */
function pick<T>(arr: T[], seed: number): T {
  const idx = Math.floor(seed / 10) % arr.length;
  return arr[idx];
}

export function generateRelatableFacts(monthlyCost: number, monthlyWaterMl: number): RelatableFacts {
  const monthlyWaterL = monthlyWaterMl / 1000;

  // ─── COST FACTS ────────────────────────────────────────────────────────────
  let costFact = "";

  if (monthlyCost <= 0) {
    costFact = "✨ Essentially free — zero financial footprint this month!";

  } else if (monthlyCost < 1) {
    const pool = [
      `🪙 Less than a single gumball from a 25¢ machine. Seriously cheap.`,
      `☕ That's cheaper than the loose change you find in a sofa cushion.`,
      `🎲 You'd spend more money on a single dice roll at an arcade.`,
      `🍬 A handful of penny candy from the corner store costs more than this.`,
      `📎 Even a box of paper clips is pricier. This is remarkably efficient.`,
      `🚿 You'll spend more on the water for one shower than on this LLM call.`,
      `🔋 Cheaper than the electricity to charge your phone for a day.`,
      `🐜 Ants carry food proportionally worth more than this. Tiny but mighty.`,
      `🧻 Less than a single sheet of premium tissue paper from a fancy hotel.`,
      `🌱 A sunflower seed costs more. This is practically free-range computing.`,
    ];
    costFact = pick(pool, monthlyCost * 1000);

  } else if (monthlyCost < 10) {
    const n = Math.max(1, Math.round(monthlyCost / 4));
    const pool = [
      `☕ That's about ${n} artisan coffee(s) — your barista is more expensive than your AI.`,
      `🍕 Roughly ${Math.round(monthlyCost / 2)} slices of NYC pizza. The AI costs less than lunch.`,
      `🎵 You could buy ${Math.round(monthlyCost / 1.29)} songs on iTunes for this — or let AI answer questions all month.`,
      `🧃 ${Math.round(monthlyCost / 3)} fresh fruit juices from a café. AI runs on less than your afternoon drink.`,
      `🎮 Less than a single mobile game power-up pack. Real intelligence, app-store price.`,
      `📚 Cheaper than a used paperback novel. The AI reads faster too.`,
      `🍩 About ${Math.round(monthlyCost / 2)} glazed doughnuts. Delicious value.`,
      `🚌 That's a couple of bus rides. Your AI commute costs nothing.`,
      `🍦 ${Math.round(monthlyCost / 3)} scoops of ice cream. Sweet, affordable intelligence.`,
      `🧁 Less than a cupcake at a trendy bakery. Way fewer calories too.`,
    ];
    costFact = pick(pool, monthlyCost * 100);

  } else if (monthlyCost < 100) {
    const subs = Math.round(monthlyCost / 20);
    const pool = [
      `📺 That's ${Math.round(monthlyCost / 18)} Netflix subscriptions a month — your AI binge costs less.`,
      `🎮 About ${subs} ChatGPT Plus plans. You're basically buying AI in bulk.`,
      `🍣 ${Math.round(monthlyCost / 12)} takeaway sushi rolls. The AI's calorie-free AND cheaper.`,
      `🎵 ${Math.round(monthlyCost / 11)} months of Spotify Premium. Your AI playlist never repeats.`,
      `🥗 Roughly ${Math.round(monthlyCost / 15)} healthy meal-kit deliveries. AI eats nothing in return.`,
      `🏋️ ${Math.round(monthlyCost / 30)} gym day passes. The AI is already in shape.`,
      `🎬 ${Math.round(monthlyCost / 15)} cinema tickets for the latest blockbuster. Drama without the popcorn.`,
      `📱 About ${Math.round(monthlyCost / 10)} months of a mobile plan. Better signal than your carrier.`,
      `🛏️ ${Math.round(monthlyCost / 30)} nights on a budget hostel bed. AI never sleeps.`,
      `🍷 ${Math.round(monthlyCost / 25)} decent bottles of wine. Cheers to efficient computing!`,
    ];
    costFact = pick(pool, monthlyCost * 10);

  } else if (monthlyCost < 1000) {
    const airpods = Math.round(monthlyCost / 150);
    const pool = [
      `🎧 ${airpods} pair(s) of AirPods Pro every single month. Your AI habit costs as much as premium headphones.`,
      `👟 ${Math.round(monthlyCost / 200)} pairs of Nike Air Max. Your AI literally costs a shoe drop.`,
      `📷 ${Math.round(monthlyCost / 500)} GoPro cameras. Go document your AI adventures.`,
      `🎸 ${Math.round(monthlyCost / 300)} entry-level guitars. Rock on, LLM.`,
      `✈️ ${Math.round(monthlyCost / 250)} budget airline flights. Your AI travels at the speed of tokens.`,
      `🎮 ${Math.round(monthlyCost / 70)} brand-new video games. Game over for boring research.`,
      `📚 ${Math.round(monthlyCost / 120)} months of a Coursera annual plan. The AI never stops learning either.`,
      `🏕️ ${Math.round(monthlyCost / 150)} nights glamping under the stars. AI doesn't need a tent.`,
      `🧳 ${Math.round(monthlyCost / 400)} premium carry-on suitcases. No baggage fees for your AI.`,
      `🖨️ ${Math.round(monthlyCost / 350)} mid-range printers — though your AI creates better output.`,
    ];
    costFact = pick(pool, monthlyCost);

  } else if (monthlyCost < 10000) {
    const macs = formatNumber(monthlyCost / 1600, 1);
    const pool = [
      `💻 That's ${macs} MacBook Pro M4(s) per month. Your AI runs a mini Apple Store.`,
      `🏍️ ${formatNumber(monthlyCost / 5000, 1)} Honda scooter(s) a month. Your AI commutes at the speed of light.`,
      `💎 ${Math.round(monthlyCost / 2000)} high-end smartwatches. Time flies when AI is computing.`,
      `📡 ${Math.round(monthlyCost / 1200)} months of satellite internet. Your AI has better bandwidth.`,
      `🛋️ ${Math.round(monthlyCost / 2500)} designer sofas. Sit back and let the AI do the work.`,
      `🖥️ ${Math.round(monthlyCost / 3500)} professional 4K monitors. Your AI sees everything clearly.`,
      `🎻 ${formatNumber(monthlyCost / 4000, 1)} professional violins. A symphony of tokens.`,
      `🏄 ${Math.round(monthlyCost / 1500)} surfboard + wetsuit kits. Ride the AI wave.`,
      `🔭 ${formatNumber(monthlyCost / 7000, 1)} amateur telescopes. AI sees further.`,
      `🧑‍🍳 ${Math.round(monthlyCost / 2000)} professional chef knife sets. Cutting-edge, literally.`,
    ];
    costFact = pick(pool, monthlyCost / 10);

  } else {
    const devs = Math.round(monthlyCost / 1000);
    const pool = [
      `👩‍💻 ${devs} full-time software developer salaries ($1k/mo). Your AI is running a whole team.`,
      `🏢 You could rent ${Math.round(monthlyCost / 3000)} co-working desks in NYC every month. AI works from everywhere.`,
      `🏎️ ${formatNumber(monthlyCost / 50000, 1)} used Tesla Model 3(s) every month. Fast like your model, efficient too.`,
      `🎓 ${Math.round(monthlyCost / 2500)} college credit hours at a state university. AI has a PhD already.`,
      `🌍 Enough to fund ${Math.round(monthlyCost / 5000)} international round-trip flights. AI doesn't need a visa.`,
      `🏡 ${formatNumber(monthlyCost / 20000, 2)} months of a mortgage on a median US home. AI is real estate too.`,
      `🚀 A fraction of a SpaceX Starlink terminal deployment. Your AI has orbit-level ambition.`,
      `🎬 ${formatNumber(monthlyCost / 100000, 2)} days of Hollywood film production. Lights, camera, tokens!`,
      `🏥 ${Math.round(monthlyCost / 1500)} ER visits' worth of cost in the US. Your AI is more affordable than healthcare.`,
      `⚡ Enough electricity to power ${Math.round(monthlyCost / 100)} US homes for a day — but it's smarter.`,
    ];
    costFact = pick(pool, monthlyCost / 100);
  }

  // ─── WATER FACTS ───────────────────────────────────────────────────────────
  let waterFact = "";

  if (monthlyWaterL <= 0) {
    waterFact = "💧 No water footprint this month. Pristinely dry.";

  } else if (monthlyWaterL < 1) {
    const pool = [
      `💧 Less than a single sip of water. Your AI is practically desert-air dry.`,
      `🌵 Smaller than a cactus's daily intake. Incredibly efficient.`,
      `🐜 An ant would drink proportionally more. Tiny footprint!`,
      `🔬 You'd need a microscope to see this water footprint on a global scale.`,
      `🫧 Less than a soap bubble's worth. Barely there.`,
    ];
    waterFact = pick(pool, monthlyWaterL * 10000);

  } else if (monthlyWaterL < 10) {
    const bottles = Math.round(monthlyWaterL / 0.5);
    const pool = [
      `🍶 ${bottles} standard 500mL water bottles. Your AI is thirstier than a hamster.`,
      `🌱 Enough to water a houseplant for ${Math.round(monthlyWaterL / 0.3)} days.`,
      `🎨 Less water than you'd use to rinse a single paintbrush.`,
      `🧪 Fits in a small lab beaker. Science says this is very manageable.`,
      `🐟 Not enough to fill a goldfish bowl. Your AI is eco-friendlier than your pet.`,
      `🫗 About ${Math.round(monthlyWaterL / 0.25)} average glasses of water. Barely a round.`,
      `🧃 Fewer than ${Math.max(1, Math.round(monthlyWaterL / 0.3))} juice boxes. Surprisingly tiny.`,
      `☁️ A cloud produces this much water vapor in seconds. You're below cloud-level.`,
    ];
    waterFact = pick(pool, monthlyWaterL * 1000);

  } else if (monthlyWaterL < 100) {
    const people = Math.round(monthlyWaterL / 2);
    const pool = [
      `🚿 Enough for ${Math.round(monthlyWaterL / 65)} average showers. Your AI takes fewer than you do.`,
      `🧑‍🤝‍🧑 Daily drinking water for ${people} people. Your AI is supporting a small group.`,
      `🪣 ${Math.round(monthlyWaterL / 10)} full household buckets. A fraction of a backyard pool.`,
      `🌻 Enough to keep ${Math.round(monthlyWaterL / 1.5)} sunflower plants happy for a week.`,
      `🏊 ${formatNumber(monthlyWaterL / 2500000 * 100, 4)}% of an Olympic swimming pool. Practically microscopic.`,
      `🍝 Water used to cook ${Math.round(monthlyWaterL / 5)} pots of pasta. Al dente computing.`,
      `🐕 Enough water to give ${Math.round(monthlyWaterL / 5)} dogs their daily drink. Woof-efficiency.`,
      `🧼 Less than ${Math.round(monthlyWaterL / 7)} full hand-washing sessions. Clean conscience.`,
    ];
    waterFact = pick(pool, monthlyWaterL * 100);

  } else if (monthlyWaterL < 1000) {
    const baths = Math.round(monthlyWaterL / 150);
    const pool = [
      `🛁 ${baths} standard bathtub(s) of water evaporated to keep your AI cool.`,
      `🚗 Enough to hand-wash ${Math.round(monthlyWaterL / 120)} cars. Your AI is doing a lot of heavy lifting.`,
      `🌳 Water consumption of ${Math.round(monthlyWaterL / 450)} mature oak trees for a month.`,
      `🏡 ${Math.round(monthlyWaterL / 300)} days' worth of an average US household's daily water use.`,
      `🐊 Enough water to keep ${Math.round(monthlyWaterL / 500)} alligators comfortable for a day.`,
      `🏗️ Roughly the water used pouring ${Math.round(monthlyWaterL / 200)} cubic meters of concrete.`,
      `🍺 About ${Math.round(monthlyWaterL / 8)} kegs of beer's worth of water. Cheers!`,
      `🌾 Irrigation water for ${formatNumber(monthlyWaterL / 500, 1)} square meters of wheat field.`,
    ];
    waterFact = pick(pool, monthlyWaterL * 10);

  } else if (monthlyWaterL < 10000) {
    const tshirts = Math.round(monthlyWaterL / 2500);
    const pool = [
      `👕 Water footprint of ${tshirts} cotton T-shirt(s). Fashion has never been so digital.`,
      `☕ Equivalent to brewing ${Math.round(monthlyWaterL / 140)} kg of coffee. That's a serious café operation.`,
      `🐄 Water consumed by ${Math.round(monthlyWaterL / 3500)} dairy cows in a day. Moo-maginative.`,
      `🥩 Enough to produce ${formatNumber(monthlyWaterL / 15000, 1)} kg of beef. Your AI is beefy.`,
      `🏊 About ${formatNumber(monthlyWaterL / 2500, 1)} average backyard swimming pools.`,
      `🌽 Irrigation for ${Math.round(monthlyWaterL / 1000)} kg of corn. Your AI could feed a village.`,
      `🏭 Less than a factory uses in an hour. Industrial-scale efficiency.`,
      `🛩️ Roughly the water used to manufacture ${formatNumber(monthlyWaterL / 50000, 2)} commercial airline seats.`,
    ];
    waterFact = pick(pool, monthlyWaterL);

  } else {
    const peopleYear = formatNumber(monthlyWaterL / (2 * 365), 1);
    const pool = [
      `🌍 Annual drinking water supply for ${peopleYear} people. Your AI is running at city-scale.`,
      `🏙️ Comparable to a small town's monthly residential water use. Urban AI vibes.`,
      `🏞️ Enough to fill ${Math.round(monthlyWaterL / 1000000)} small lakes. Nature-scale computation.`,
      `🚒 ${Math.round(monthlyWaterL / 10000)} full fire truck tankers. Your AI is fighting fires — metaphorically.`,
      `🎡 More than the water used by a mid-size amusement park in a day.`,
      `⛵ Enough to float ${Math.round(monthlyWaterL / 500000)} small sailboats. Set sail, AI.`,
      `🌊 A meaningful fraction of a river's daily flow. Your AI is making waves.`,
      `🏊 ${Math.round(monthlyWaterL / 2500)} Olympic swimming pools. Splash zone: AI.`,
    ];
    waterFact = pick(pool, monthlyWaterL / 100);
  }

  return { costFact, waterFact };
}