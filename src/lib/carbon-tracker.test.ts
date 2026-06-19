import { describe, it, expect } from "vitest";
import { calculateCarbon, CarbonInputs, DietType } from "./carbon-tracker";

describe("calculateCarbon", () => {
  it("should correctly calculate the carbon footprint for a typical user", () => {
    const inputs: CarbonInputs = {
      transport: {
        carMilesPerWeek: 100,
        flightsPerYear: 2,
      },
      energy: {
        electricityKwhPerMonth: 300,
        peopleInHousehold: 2,
      },
      diet: {
        dietType: "vegetarian",
      },
      shopping: {
        shoppingSpendPerMonth: 5000,
      },
    };

    const result = calculateCarbon(inputs);

    // Assert transport:
    // Car: 100 * 52 * 0.27785 = 1444.82
    // Flight: 2 * 4000 * 0.14253 = 1140.24
    // Total Transport = 1444.82 + 1140.24 = 2585.06 (approx 2585)
    expect(result.breakdown.transport).toBeCloseTo(2585, -1);

    // Assert energy:
    // (300 * 12 / 2) * 0.13096 = 235.728
    expect(result.breakdown.energy).toBeCloseTo(236, -1);

    // Assert diet:
    // vegetarian = 0.45 * 365 = 164.25
    expect(result.breakdown.diet).toBeCloseTo(164, -1);

    // Assert shopping:
    // (5000 * 12) * 0.003 = 180
    expect(result.breakdown.shopping).toBeCloseTo(180, -1);

    // Assert total
    const expectedTotal = 2585 + 236 + 164 + 180;
    expect(result.totalKg).toBeCloseTo(expectedTotal, -2);

    // Assert letter grade (3165 kg is < 3500, should be a B)
    expect(result.grade).toBe("B");
  });

  it("should calculate footprint correctly for a heavy meat eater who drives a lot", () => {
    const inputs: CarbonInputs = {
      transport: { carMilesPerWeek: 200, flightsPerYear: 3 },
      energy: { electricityKwhPerMonth: 500, peopleInHousehold: 1 },
      diet: { dietType: "meat_heavy" },
      shopping: { shoppingSpendPerMonth: 1000 }, // ~12k USD/year -> maybe massive footprint
    };
    const result = calculateCarbon(inputs);
    expect(result.totalKg).toBeGreaterThan(5000);
    // Grade F is highly likely for 5000+ kg
  });

  it("should calculate footprint for an eco-friendly user", () => {
    const inputs: CarbonInputs = {
      transport: { carMilesPerWeek: 0, flightsPerYear: 0 },
      energy: { electricityKwhPerMonth: 150, peopleInHousehold: 2 },
      diet: { dietType: "vegan" },
      shopping: { shoppingSpendPerMonth: 100 },
    };
    const result = calculateCarbon(inputs);
    expect(result.totalKg).toBeLessThan(3000);
    expect(result.grade).toMatch(/A|B/);
  });

  it("should return 0 footprint for zero inputs", () => {
    const inputs: CarbonInputs = {
      transport: { carMilesPerWeek: 0, flightsPerYear: 0 },
      energy: { electricityKwhPerMonth: 0, peopleInHousehold: 1 },
      diet: { dietType: "vegan" }, // vegan still has a base footprint
      shopping: { shoppingSpendPerMonth: 0 },
    };

    const result = calculateCarbon(inputs);

    expect(result.breakdown.transport).toBe(0);
    expect(result.breakdown.energy).toBe(0);
    expect(result.breakdown.shopping).toBe(0);

    // Vegan is 0.35 * 365 = 127.75
    expect(result.breakdown.diet).toBeCloseTo(128, -1);
    expect(result.totalKg).toBeCloseTo(128, -1);
    expect(result.grade).toBe("A+");
  });
});
