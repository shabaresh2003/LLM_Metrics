# TokenMetrics.ai — LLM Cost, Performance & Carbon Calculator

TokenMetrics.ai is a side-by-side benchmarking and playground calculator for evaluating Large Language Models (LLMs). It quantifies the financial cost, end-to-end latency, energy consumption, water footprint, and CO₂e carbon emissions for commercial LLM queries (GPT, Claude, and Gemini).

All calculations run locally in your browser (privacy-first).

---

## Key Features

- **Side-by-Side Comparison:** Compare GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and many more models simultaneously.
- **Multidimensional Benchmarking:**
  - **Financial Cost (USD):** Calculated per million tokens based on current vendor API pricing.
  - **Latency (TTFT & E2E):** Estimates prefill and autoregressive token generation durations.
  - **Energy (Wh):** Empirical hardware-level energy estimates (Jegham et al. 2025).
  - **Water footprint (mL):** Scope-1 (cooling) and Scope-2 (power-generation) water footprint models (Li et al. 2023).
  - **CO₂e Emissions (g):** Datacenter electricity draw mapped to local grid carbon intensity factors.
- **File Upload:** Upload text files or PDFs to analyze prompt tokens and calculate footprints immediately.
- **Interactive Graphs:** Dynamic charts showing cost vs. eco-efficiency trade-offs and energy comparisons.
- **PDF Report Export:** Download structured evaluation reports directly from the browser.

---

## Technology Stack

- **Core Framework:** React 19, TypeScript
- **Routing & Server Rendering:** TanStack Start (TanStack Router)
- **Styling:** TailwindCSS
- **Charts:** Recharts
- **Bundler:** Vite
- **Deployment Ready:** Cloudflare Pages (via `@cloudflare/vite-plugin`)

---

## Calculation Methodology

### 1. Cost (USD)
$$\text{Cost} = \left(\frac{\text{Input Tokens}}{1,000,000} \times \text{Input Price / MTok}\right) + \left(\frac{\text{Output Tokens}}{1,000,000} \times \text{Output Price / MTok}\right)$$

### 2. Latency (ms)
- **Time to First Token (TTFT):** Baseline prompt prefill latency (model specific).
- **End-to-End (E2E) Latency:**
  $$\text{E2E Latency} = \text{TTFT} + \left(\frac{\text{Output Tokens}}{\text{Tokens/Second}} \times 1000\right)$$

### 3. Energy Consumption (Wh)
- **Facility Energy:** Accounts for datacenter overhead using Power Usage Effectiveness (PUE):
  $$\text{Facility Energy} = \text{Total Tokens} \times \text{Energy Per Token (at chip)} \times \text{PUE}$$

### 4. Water Footprint (mL)
Calculates direct on-site cooling evaporation and indirect power generation water consumption:
$$\text{Water (mL)} = \text{Facility Energy (kWh)} \times \left(\text{WUE}_{\text{on-site}} + \text{WUE}_{\text{electricity}}\right) \times 1000$$

### 5. Carbon Emissions (g CO₂e)
Standard Greenhouse Gas (GHG) Protocol Scope 2 location-based calculation:
$$\text{CO}_2\text{e (g)} = \text{Facility Energy (kWh)} \times \text{Grid Carbon Intensity (g/kWh)}$$

---

## Local Setup

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

3. Build the application:
   ```bash
   npm run build
   ```

---

## References
- **Energy Estimations:** *Jegham et al. (2025) "How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference."*
- **Water Footprint Estimations:** *Li et al. (2023) "Making AI Less 'Thirsty': Uncovering and Addressing the Secret Water Footprint of AI Models."*
