import factors from "./factors.json";

export interface TransportInputs {
  carMilesPerWeek: number;
  flightsPerYear: number;
}

export interface EnergyInputs {
  electricityKwhPerMonth: number;
  peopleInHousehold: number;
}

export type DietType = "meat_heavy" | "meat_medium" | "meat_low" | "pescatarian" | "vegetarian" | "vegan";

export interface DietInputs {
  dietType: DietType;
}

export interface ShoppingInputs {
  shoppingSpendPerMonth: number;
}

export interface CarbonInputs {
  transport: TransportInputs;
  energy: EnergyInputs;
  diet: DietInputs;
  shopping: ShoppingInputs;
}

export interface CarbonCategoryBreakdown {
  transport: number;
  energy: number;
  diet: number;
  shopping: number;
}

export interface CarbonResult {
  totalKg: number;
  grade: string;
  breakdown: CarbonCategoryBreakdown;
  actions: RecommendationAction[];
}

export interface RecommendationAction {
  id: string;
  title: string;
  description: string;
  annualSavingsKg: number;
  effort: "easy" | "medium" | "hard";
}

export interface HistoryEntry {
  id: string;
  date: string;
  totalKg: number;
  inputs: CarbonInputs;
}

const HISTORY_KEY = "carbon_tracker_history";

/**
 * Full footprint computation
 */
export function calculateCarbon(inputs: CarbonInputs): CarbonResult {
  // 1. Transport (Annual)
  // Car miles * 52 weeks
  const annualCarMiles = inputs.transport.carMilesPerWeek * 52;
  const carEmissions = annualCarMiles * factors.car_kg_per_mile;
  
  // Flights: assume average flight is 2000 km (round trip = 4000 km per flight)
  // factor is per km
  const annualFlightKm = inputs.transport.flightsPerYear * 4000;
  const flightEmissions = annualFlightKm * factors.flight_kg_per_km;
  
  const transportTotal = carEmissions + flightEmissions;

  // 2. Energy (Annual, per person sharing)
  // kWh per month * 12 months / people
  const annualElectricity = (inputs.energy.electricityKwhPerMonth * 12) / Math.max(1, inputs.energy.peopleInHousehold);
  const energyTotal = annualElectricity * factors.electricity_kg_per_kwh;

  // 3. Diet (Annual)
  // kg per day * 365
  const dietDailyFactor = factors.diet_kg_per_day[inputs.diet.dietType] || factors.diet_kg_per_day.meat_medium;
  const dietTotal = dietDailyFactor * 365;

  // 4. Shopping (Annual)
  // spend per month * 12
  const annualShoppingSpend = inputs.shopping.shoppingSpendPerMonth * 12;
  // Convert INR to approximate GBP or use adjusted factor (0.35 kg/£ -> 0.0035 kg/₹)
  const shoppingTotal = annualShoppingSpend * factors.shopping_kg_per_inr;

  const totalKg = transportTotal + energyTotal + dietTotal + shoppingTotal;

  // Grade System
  let grade = "F";
  if (totalKg < 1000) grade = "A+";
  else if (totalKg < 2300) grade = "A"; // Paris 2030 target is 2300
  else if (totalKg < 3500) grade = "B";
  else if (totalKg < 4800) grade = "C"; // Global avg is 4800
  else if (totalKg < 7000) grade = "D";
  else if (totalKg <= 9000) grade = "E";

  const breakdown = {
    transport: Math.round(transportTotal),
    energy: Math.round(energyTotal),
    diet: Math.round(dietTotal),
    shopping: Math.round(shoppingTotal),
  };

  return {
    totalKg: Math.round(totalKg),
    grade,
    breakdown,
    actions: [] // Actions are now fetched asynchronously via Gemini
  };
}



import { syncHistoryToCloud } from "./firestore";

/**
 * LocalStorage management
 */
export function saveToHistory(inputs: CarbonInputs, result: CarbonResult) {
  if (typeof window === "undefined") return;
  const entry: HistoryEntry = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    totalKg: result.totalKg,
    inputs
  };
  
  const history = loadHistory();
  history.push(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  // Sync to Cloud Firestore asynchronously
  let userId = localStorage.getItem("ecometrics_user_id");
  if (!userId) {
    userId = "user_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("ecometrics_user_id", userId);
  }

  syncHistoryToCloud({
    data: {
      userId,
      totalKg: result.totalKg,
      inputs,
      breakdown: result.breakdown,
      grade: result.grade,
      timestamp: entry.date,
    }
  }).catch(err => console.error("Cloud sync trigger failed:", err));
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}
