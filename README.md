# EcoMetrics.ai — Personal & AI Carbon Footprint Calculator

EcoMetrics.ai is a comprehensive, privacy-first carbon calculation engine designed to help users track and reduce their carbon footprint. The application provides localized, science-backed environmental analytics for daily lifestyle choices (transport, energy, diet, shopping) alongside detailed environmental impact benchmarking for Large Language Models (LLMs).

While our primary focus is on robust **Carbon Calculation** and actionable emission reductions, the application also includes multidimensional benchmarking for AI models—calculating financial costs, latency, water usage, and energy overhead as secondary metrics.

### Why AI Metrics?
In a world where everyone is rapidly adopting and using Large Language Models (LLMs) daily, very few people are aware of the hidden, actual costs of generating responses. Beyond financial API costs, two of the most significant and often invisible environmental impacts of AI are its massive carbon footprint and extensive water usage for cooling data centers. EcoMetrics.ai sheds light on these invisible costs so developers and consumers can make eco-conscious model choices.

---

## 🌍 Core Features

### 1. Personal Carbon Tracker
A personalized assessment engine that calculates an individual's carbon footprint across four key sectors:
- **Transport:** Footprints calculated per mile driven or km flown.
- **Energy:** Domestic electricity consumption scaled by household size.
- **Diet:** Dietary choices ranging from heavy meat consumption to vegan.
- **Shopping:** Monthly expenditure converted to carbon equivalents.
- **AI Recommendations:** Context-aware, personalized emission reduction actions generated using Gemini 2.5 Flash.

### 2. AI Model Benchmarking
Compare the environmental and financial costs of queries across Frontier and Small Language Models:
- **Carbon Emissions (g CO₂e):** Datacenter electricity draw mapped to grid carbon intensity.
- **Energy (Wh):** Empirical hardware-level energy estimates.
- **Water Footprint (mL):** Scope-1 (cooling) and Scope-2 (power-generation) water footprint models.
- **Financial Cost (USD) & Latency:** (Secondary) Calculated per million tokens and time-to-first-token (TTFT).

---

## 🔬 Calculation Methodology & References

The calculator avoids mocked data and relies on strictly extracted numbers from official academic and government reports.

### References
1. **UK Government GHG Conversion Factors (2026):**
   - Official baseline for electricity (`0.13096 kg CO₂e / kWh`), passenger vehicles (`0.27785 kg CO₂e / mile`), and business travel air (`0.14253 kg CO₂e / km`).
   - Source: *UK Government GHG Conversion Factors for Company Reporting (DEFRA).*
   
2. **Household Carbon Footprint of India (Policy Brief 53):**
   - Provides localized footprint targets and diet models, tracking the average Indian per-capita emission (~1472 kg CO₂e/year) and extremely low dietary footprints (~0.56 kg CO₂e/day).
   - Source: *Nautiyal, Goswami, Kishan & Premkumar (May 2023).*

3. **Small Language Model Energy Estimation:**
   - Real-world energy and latency profiles specifically for **nanoGPT (124M)** and **TinyLlama (1.1B)** running on hardware like Nvidia 3060Ti and Apple M1.
   - Source: *"Assessing the carbon footprint of language models" (Reference PDF).*

4. **Frontier Model Footprints:**
   - **Energy Estimations:** *Jegham et al. (2025) "How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference."*
   - **Water Footprint Estimations:** *Li et al. (2023) "Making AI Less 'Thirsty': Uncovering and Addressing the Secret Water Footprint of AI Models."*

### Key Formulas
- **Personal Footprint (e.g. Energy):** 
  $$\text{Energy Carbon} = \frac{\text{kWh} \times 12}{\text{Household Size}} \times 0.13096 \text{ kg CO₂e/kWh}$$
- **AI Carbon Footprint:**
  $$\text{CO}_2\text{e (g)} = \text{Total Tokens} \times \text{Energy Per Token} \times \text{PUE} \times \text{Grid Carbon Intensity}$$

---

## 🛠 Technology Stack

- **Core Framework:** React 19, TypeScript
- **Routing & SSR:** TanStack Start
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Bundler:** Vite
- **AI Advisor Backend:** Google Generative AI (`gemini-2.5-flash`)

---

## 🚀 Local Setup

### Prerequisites
- Node.js (v20.19.0+ or v22.12.0+)
- npm (v10.0.0+)

### Steps

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:8080` in your browser.

3. Build the application for production:
   ```bash
   npm run build
   ```
