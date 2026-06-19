import { createServerFn } from "@tanstack/react-start";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CarbonInputs, CarbonCategoryBreakdown, RecommendationAction } from "./carbon-tracker";
import { getFallbackActions } from "./fallback-actions";

// The API key should be provided via environment variables (e.g. .env file)
const API_KEY = process.env.GEMINI_API_KEY || "";

// Initialize the Google Generative AI client once globally to save memory
const genAI = new GoogleGenerativeAI(API_KEY);
// We will use gemini-2.5-flash for fast and reliable responses
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generatePersonalizedActions = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: unknown }) => {
    const typedData = data as {
      inputs: CarbonInputs;
      breakdown: CarbonCategoryBreakdown;
      totalKg: number;
    };

    // Security: Validate payload shape to prevent injection or DoS
    if (
      !typedData ||
      typeof typedData.totalKg !== "number" ||
      typeof typedData.inputs?.transport?.carMilesPerWeek !== "number" ||
      typeof typedData.inputs?.diet?.dietType !== "string" ||
      typedData.inputs.diet.dietType.length > 50
    ) {
      throw new Error("Invalid request payload");
    }
    try {
      const prompt = `
      You are an expert environmental consultant providing advice on a personalized carbon footprint calculator. 
      The user has a total annual carbon footprint of ${typedData.totalKg} kg CO2e.
      Their category breakdown (in kg CO2e) is:
      - Transport: ${typedData.breakdown.transport}
      - Energy: ${typedData.breakdown.energy}
      - Diet: ${typedData.breakdown.diet}
      - Shopping: ${typedData.breakdown.shopping}

      Their specific inputs were:
      - Transport: ${typedData.inputs.transport.carMilesPerWeek} car miles/week, ${typedData.inputs.transport.flightsPerYear} flights/year.
      - Energy: ${typedData.inputs.energy.electricityKwhPerMonth} kWh/month electricity, shared by ${typedData.inputs.energy.peopleInHousehold} people.
      - Diet: ${typedData.inputs.diet.dietType.replace("_", " ")}.
      - Shopping: ₹${typedData.inputs.shopping.shoppingSpendPerMonth} per month on goods/services.

      Based on these precise numbers, generate up to 4 personalized, highly actionable recommendations for how they can reduce their footprint.
      Only recommend actions that make sense for their specific inputs. For example, do not recommend driving less if their car miles are already 0. Do not recommend reducing flights if flights are 0.
      
      Respond strictly in the following JSON format. Do not use markdown wrappers like \`\`\`json.
      [
        {
          "id": "unique-id",
          "title": "Short actionable title",
          "description": "1 sentence explanation of why and how.",
          "annualSavingsKg": <number representing realistic estimated kg CO2e saved annually>,
          "effort": "easy" | "medium" | "hard"
        }
      ]
      `;

      const result = await model.generateContent(prompt);
      const text = result.response
        .text()
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const actions: RecommendationAction[] = JSON.parse(text);
      return actions.slice(0, 4); // ensure max 4
    } catch (e) {
      console.error("Gemini API Error. Falling back to rule-based actions:", e);
      return getFallbackActions(typedData.inputs);
    }
  },
);
