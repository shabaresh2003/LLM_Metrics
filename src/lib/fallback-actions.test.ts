import { describe, it, expect } from "vitest";
import { getFallbackActions } from "./fallback-actions";
import type { CarbonInputs } from "./carbon-tracker";

describe("fallback-actions.ts", () => {
  const baseInputs: CarbonInputs = {
    transport: { carMilesPerWeek: 0, mpg: 25, publicTransitMilesPerWeek: 0, flightsPerYear: 0 },
    energy: { electricityKwhPerMonth: 0, peopleInHousehold: 1 },
    diet: { dietType: "vegan", localFoodPercentage: 100 },
    shopping: { shoppingSpendPerMonth: 0, usesSecondHand: true },
  };

  it("should return EV/carpool action if driving miles are high", () => {
    const inputs: CarbonInputs = {
      ...baseInputs,
      transport: { ...baseInputs.transport, carMilesPerWeek: 150 },
    };
    const actions = getFallbackActions(inputs);
    expect(actions.some((a) => a.title.includes("Carpool"))).toBe(true);
  });

  it("should return flight reduction action if flights are >= 3", () => {
    const inputs: CarbonInputs = {
      ...baseInputs,
      transport: { ...baseInputs.transport, flightsPerYear: 3 },
    };
    const actions = getFallbackActions(inputs);
    expect(actions.some((a) => a.title.includes("Air Travel"))).toBe(true);
  });

  it("should return energy efficiency action if kWh is high", () => {
    const inputs: CarbonInputs = {
      ...baseInputs,
      energy: { electricityKwhPerMonth: 500, peopleInHousehold: 1 },
    };
    const actions = getFallbackActions(inputs);
    expect(actions.some((a) => a.title.includes("Renewable"))).toBe(true);
  });

  it("should return plant-based action if diet is meat heavy", () => {
    const inputs: CarbonInputs = {
      ...baseInputs,
      // @ts-expect-error test
      diet: { dietType: "meat_heavy", localFoodPercentage: 0 },
    };
    const actions = getFallbackActions(inputs);
    expect(actions.some((a) => a.title.includes("Meatless"))).toBe(true);
  });

  it("should handle the perfect eco user gracefully", () => {
    const actions = getFallbackActions(baseInputs);
    expect(actions.length).toBeGreaterThan(0); // Should always return at least general advice
  });
});
