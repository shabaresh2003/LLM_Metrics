import { describe, it, expect } from "vitest";
import {
  getModel,
  formatUsd,
  formatNumber,
  computeMetrics,
  generateRelatableFacts,
  MODELS,
} from "./metrics";

describe("metrics.ts", () => {
  it("should format USD correctly", () => {
    expect(formatUsd(0)).toBe("$0.00");
    expect(formatUsd(0.00005)).toBe("$5.00e-5");
    expect(formatUsd(0.005)).toBe("$0.00500");
    expect(formatUsd(0.5)).toBe("$0.5000");
    expect(formatUsd(5.5)).toBe("$5.50");
  });

  it("should format numbers correctly", () => {
    expect(formatNumber(0)).toBe("0.00");
    expect(formatNumber(12.345, 1)).toBe("12.3");
    expect(formatNumber(1500)).toBe("1,500");
    expect(formatNumber(NaN)).toBe("—");
    expect(formatNumber(Infinity)).toBe("—");
  });

  it("should find an existing model by ID", () => {
    const model = getModel("gpt-4o");
    expect(model).toBeDefined();
    expect(model?.id).toBe("gpt-4o");
  });

  it("should return undefined for non-existent model", () => {
    expect(getModel("non-existent-model")).toBeUndefined();
  });

  it("should compute accurate metrics for a given model", () => {
    const model = getModel("gpt-4o");
    if (!model) throw new Error("Model gpt-4o not found");

    const result = computeMetrics({
      model,
      inputTokens: 1000,
      outputTokens: 500,
    });

    expect(result.model.id).toBe("gpt-4o");
    expect(result.inputTokens).toBe(1000);
    expect(result.outputTokens).toBe(500);
    expect(result.totalTokens).toBe(1500);
    
    // Check that financial cost and physical resources were computed (should be > 0)
    expect(result.costUsd).toBeGreaterThan(0);
    expect(result.waterMl).toBeGreaterThan(0);
    expect(result.co2eG).toBeGreaterThan(0);
    expect(result.e2eLatencyMs).toBeGreaterThan(0);
  });

  it("should calculate zero metrics if 0 tokens are provided", () => {
    const model = getModel("gpt-4o")!;
    const result = computeMetrics({
      model,
      inputTokens: 0,
      outputTokens: 0,
    });

    expect(result.totalTokens).toBe(0);
    expect(result.costUsd).toBe(0);
    expect(result.waterMl).toBe(0);
    expect(result.co2eG).toBe(0);
    expect(result.e2eLatencyMs).toBe(0);
  });

  it("should generate relatable facts based on monthly cost and water", () => {
    const factsLow = generateRelatableFacts(0.5, 500); // 0.5L water
    expect(factsLow.costFact).toBeTruthy();
    expect(factsLow.waterFact).toBeTruthy();

    const factsHigh = generateRelatableFacts(5000, 5000000); // 5000L water
    expect(factsHigh.costFact).toBeTruthy();
    expect(factsHigh.waterFact).toBeTruthy();
  });
});
