import type { CarbonInputs, RecommendationAction } from "./carbon-tracker";

/**
 * Generates rule-based fallback actions when the Gemini AI API fails.
 */
export function getFallbackActions(inputs: CarbonInputs): RecommendationAction[] {
  const actions: RecommendationAction[] = [];

  // Transport Fallbacks
  if (inputs.transport.carMilesPerWeek > 100) {
    actions.push({
      id: "fallback-transport-ev",
      title: "Consider an EV or Carpool",
      description: "You drive significantly more than average. Transitioning to an Electric Vehicle or carpooling twice a week can drastically reduce your emissions.",
      annualSavingsKg: Math.round((inputs.transport.carMilesPerWeek * 52 * 0.27785) * 0.4),
      effort: "hard"
    });
  } else if (inputs.transport.carMilesPerWeek > 20) {
    actions.push({
      id: "fallback-transport-bike",
      title: "Replace Short Trips with Biking",
      description: "For trips under 2 miles, consider walking or biking instead of driving.",
      annualSavingsKg: 150,
      effort: "medium"
    });
  }

  if (inputs.transport.flightsPerYear >= 3) {
    actions.push({
      id: "fallback-transport-fly",
      title: "Reduce Air Travel",
      description: "Flights are highly carbon-intensive. Try to replace at least one flight per year with a train journey or a staycation.",
      annualSavingsKg: 500,
      effort: "hard"
    });
  }

  // Energy Fallbacks
  if (inputs.energy.electricityKwhPerMonth > 400) {
    actions.push({
      id: "fallback-energy-solar",
      title: "Switch to Renewable Energy",
      description: "Your household energy consumption is high. Consider switching your tariff to a 100% renewable energy provider or installing solar panels.",
      annualSavingsKg: Math.round((inputs.energy.electricityKwhPerMonth * 12 * 0.13096) * 0.8),
      effort: "hard"
    });
  } else {
    actions.push({
      id: "fallback-energy-smart",
      title: "Install a Smart Thermostat",
      description: "Optimize your heating and cooling schedules to reduce phantom energy draw.",
      annualSavingsKg: 120,
      effort: "medium"
    });
  }

  // Diet Fallbacks
  if (inputs.diet.dietType === "meat_heavy" || inputs.diet.dietType === "meat_medium") {
    actions.push({
      id: "fallback-diet-meatless",
      title: "Adopt Meatless Mondays",
      description: "Substituting meat for plant-based alternatives just one day a week can lower your food footprint significantly.",
      annualSavingsKg: 300,
      effort: "easy"
    });
  } else if (inputs.diet.dietType === "meat_low") {
    actions.push({
      id: "fallback-diet-pescatarian",
      title: "Try a Pescatarian Diet",
      description: "You already eat low amounts of meat. Cutting it out entirely for sustainable fish can reduce your footprint further.",
      annualSavingsKg: 150,
      effort: "medium"
    });
  }

  // Shopping Fallbacks
  if (inputs.shopping.shoppingSpendPerMonth > 20000) {
    actions.push({
      id: "fallback-shopping-secondhand",
      title: "Buy Second-Hand Fast Fashion",
      description: "Your consumption footprint is high. Buying refurbished electronics or second-hand clothes helps bypass manufacturing emissions.",
      annualSavingsKg: 400,
      effort: "medium"
    });
  }

  // Ensure we always return exactly 3 top actions
  return actions.sort((a, b) => b.annualSavingsKg - a.annualSavingsKg).slice(0, 3);
}
