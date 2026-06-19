# EcoMetrics.ai — Personal & AI Carbon Footprint Calculator

**EcoMetrics.ai** is a comprehensive, privacy-first carbon calculation engine designed to help users track and reduce their carbon footprint. The application provides localized, science-backed environmental analytics for daily lifestyle choices (transport, energy, diet, shopping) alongside detailed environmental impact benchmarking for Large Language Models (LLMs).

---

## 🚀 Deployed Link
You can access the live, production-ready application hosted on Google Cloud Run here:
**[https://ecometrics-677478303886.us-central1.run.app](https://ecometrics-677478303886.us-central1.run.app)**

---

## 💡 Use of this Application

### 1. Personal Carbon Tracker
A personalized assessment engine that calculates an individual's carbon footprint across four key sectors:
- **Transport:** Footprints calculated per mile driven or km flown.
- **Energy:** Domestic electricity consumption scaled by household size.
- **Diet:** Dietary choices ranging from heavy meat consumption to vegan.
- **Shopping:** Monthly expenditure converted to carbon equivalents.

### 2. AI Model Benchmarking
In a world where everyone is rapidly adopting LLMs, few people are aware of the hidden costs. This app compares the environmental and financial costs of queries across Frontier and Small Language Models:
- **Carbon Emissions (g CO₂e):** Datacenter electricity draw mapped to grid carbon intensity.
- **Energy (Wh):** Empirical hardware-level energy estimates.
- **Water Footprint (mL):** Scope-1 (cooling) and Scope-2 (power-generation) water footprint models.
- **Financial Cost (USD) & Latency:** Calculated per million tokens and time-to-first-token (TTFT).

---

## 🛠 Tech Stack Used

### Frontend & Core
- **Framework:** React 19, TypeScript
- **Routing & SSR:** TanStack Start
- **Styling:** TailwindCSS
- **Visualizations:** Recharts
- **Bundler:** Vite

### Backend & Cloud Infrastructure
- **Server:** Custom Node.js production server (`server-prod.js`)
- **Database:** Google Cloud Firestore (via `@google-cloud/firestore` for anonymous history tracking)
- **AI Advisor Backend:** Google Generative AI (`gemini-2.5-flash`)
- **Deployment:** Docker & Google Cloud Run (Serverless)
- **Security:** GCP Secret Manager for API Keys

### Testing Framework
- **Unit Testing:** Vitest

---

## 🔄 Flow and Logic

1. **User Input:** The user fills out a 4-step wizard (Transport, Energy, Diet, Shopping).
2. **Calculation Engine:** The backend crunches the raw inputs using strict GHG conversion factors.
3. **Database Sync:** The application generates a persistent, anonymous `userId` locally, and asynchronously triggers a secure backend API call to sync the detailed footprint payload to Google Cloud **Firestore**.
4. **AI/Rule-Based Action Generation:** 
   - The app asks Gemini (`gemini-2.5-flash`) to generate 4 highly personalized, actionable steps based on the math.
   - **Fallback Logic:** If the AI API times out, fails, or hits a rate limit, a deterministic `fallback-actions.ts` engine instantly intercepts the error and routes the data through hardcoded rules (e.g., if `carMilesPerWeek > 100`, recommend an EV), guaranteeing the user never sees an empty screen.
5. **Display:** The user views their total footprint, an A-F grade based on Paris 2030 targets, and their recommended actions.

---

## 📂 Project Layout

```text
token-extractor/
├── src/
│   ├── components/      # Reusable React UI components (Charts, Forms)
│   ├── lib/             # Core logic & utilities
│   │   ├── carbon-tracker.ts       # Mathematical calculation engine
│   │   ├── carbon-tracker.test.ts  # Vitest unit tests for calculations
│   │   ├── fallback-actions.ts     # Deterministic AI-fallback rules
│   │   ├── firestore.ts            # Server-side GCP Firestore logic
│   │   ├── gemini.ts               # Google Generative AI integration
│   │   └── factors.json            # Base conversion factors & metrics
│   ├── routes/          # TanStack file-based routing
│   │   ├── index.tsx                 # Landing Page
│   │   ├── carbon-tracker.tsx        # Footprint Calculator Page
│   │   └── llm-benchmarks.tsx        # LLM Comparison Page
│   └── start.ts         # TanStack Server Entry
├── server-prod.js       # Custom Node.js static asset server (Path Traversal protected)
├── Dockerfile           # Multi-stage Docker build for GCP deployment
├── package.json         # Dependencies & scripts
└── README.md            # You are here!
```

---

## 🔌 Key Endpoints Description

As a TanStack Start SSR application, API logic is heavily integrated as Server Functions (`createServerFn`), meaning the frontend can securely call backend code without traditional REST boilerplate. 

- `POST /_serverFn/generatePersonalizedActions`
  - **Description:** Accepts the mathematical `CarbonResult` and prompts `gemini-2.5-flash` to generate 4 actionable reduction steps. Implements a secure fallback mechanism to `fallback-actions.ts` on failure.
- `POST /_serverFn/syncHistoryToCloud`
  - **Description:** Secures a connection to Firestore using the default GCP service account, writing the footprint data, inputs, and timestamp to a `user_history` collection under an anonymous `userId`.

---

## 🤔 Assumptions

- **Grid Carbon Intensity:** Assumes an average carbon intensity for electricity based on UK/India government reports, rather than tracking real-time local grid fluctuations.
- **Flight Data:** Uses a flat multiplier mapping (assuming average short-to-medium haul flight lengths) rather than asking the user for exact geographic destinations.
- **Anonymity over Authentication:** Assumes the user prefers privacy; instead of forcing an OAuth login, the app uses a persistent, anonymous `localStorage` UUID to tie documents together in Firestore.

---

## 🧪 How We Tested & Secured

### 🔒 Security Audits
- **Dependency Vulnerabilities:** Regular patches via `npm audit fix` ensure all build and runtime Node.js dependencies are free of high-severity vulnerabilities.
- **Server Security Headers:** The `server-prod.js` custom Node server enforces strict HTTP security headers (`Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`) for both SSR and static assets to prevent clickjacking, MIME-sniffing, and MITM attacks.
- **Payload Validation & Prompt Injection Defense:** Runtime payload schema validation explicitly intercepts malformed or oversized requests in `gemini.ts` before interpolating variables into the Generative AI prompt, defending against Prompt Injection and memory DoS attacks.
- **Path Traversal Protection:** The custom static asset server explicitly sanitizes decoded URL pathways. Further, Firestore backend functions validate `userId` format (`/^[a-zA-Z0-9_-]+$/`) to intercept potential NoSQL path-traversal exploits.
- **Secret Management:** The production Gemini API key is securely injected at runtime via **GCP Secret Manager**—never hardcoded.

### ♿ Accessibility (a11y)
The user interface strictly follows WCAG principles:
- **Semantic HTML & Metadata:** Meaningful page titles and descriptions are injected for screen readers to announce route context accurately.
- **ARIA Labeling:** Interactive elements, icon-only buttons, and native `radix-ui` `Slider` and `Select` components are thoroughly mapped with `aria-label` attributes to ensure assistive technology compatibility.

### 🧪 Unit & Coverage Testing
The complex mathematics driving the four environmental pillars—and the deterministic AI fallback engines—are evaluated using the **Vitest** framework. 

Test suites validate:
1. `metrics.ts`: Extreme edge cases on token extraction, zero-value inputs, and financial formatting boundary checks.
2. `fallback-actions.ts`: Deterministic conditional branching, ensuring the system flawlessly intercepts offline APIs and accurately categorizes varying lifestyle extremes (e.g., massive commute footprints vs. highly-efficient vegan diets).

To execute the test suite locally with Istanbul/V8 coverage:
```bash
npx vitest run --coverage
```

---

## 📖 References

The calculator avoids mocked data and relies on strictly extracted numbers from official academic and government reports:

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

---

## 📌 Key Points
- **Memory Optimized:** The `GoogleGenerativeAI` client is hoisted to the global server scope to prevent repeated memory allocations per request, minimizing Time-To-First-Token.
- **Fail-Safe Design:** If the Google AI goes down, the application will not break; the deterministic rule engine ensures users always walk away with actionable advice.
