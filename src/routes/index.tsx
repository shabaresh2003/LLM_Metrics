import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import {
  CalculatorView,
  DEFAULT_SELECTED,
} from "@/components/calculator/CalculatorView";
import { ENV, MODELS } from "@/lib/metrics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TokenMetrics.ai — LLM cost, performance & carbon calculator" },
      {
        name: "description",
        content:
          "Compare GPT, Claude and Gemini on cost, latency, energy, water and CO₂e for any prompt. Side-by-side LLM benchmarking with a downloadable report.",
      },
      { name: "keywords", content: "LLM cost calculator, GPT vs Claude vs Gemini, AI carbon footprint, token counter, tiktoken, AI energy water" },
      { property: "og:title", content: "TokenMetrics.ai — LLM cost & carbon calculator" },
      { property: "og:description", content: "Compare GPT, Claude and Gemini on cost, latency and environmental impact." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "TokenMetrics.ai" },
      { name: "twitter:description", content: "LLM cost, performance & carbon calculator." },
      { rel: "canonical", href: "/" } as never,
    ],
  }),
  component: Index,
});

function Index() {
  // App-level state lifted so tabs share data.
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant. Answer concisely.",
  );
  const [userPrompt, setUserPrompt] = useState(
    "Summarize the key risks of deploying large language models in production.",
  );
  const [outputTokens, setOutputTokens] = useState(256);
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_SELECTED);
  const [callsPerMonth, setCallsPerMonth] = useState(10000);

  // Gemini API Key state saved to localStorage
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gemini_api_key") || "AIzaSyDb1xKbZVh_JnE1prYT3m8Keo8SHAOcdYk";
    }
    return "AIzaSyDb1xKbZVh_JnE1prYT3m8Keo8SHAOcdYk";
  });

  const updateGeminiApiKey = (key: string) => {
    setGeminiApiKey(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("gemini_api_key", key);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]">
      <Toaster richColors position="top-right" />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Hero />
        <Tabs defaultValue="calculator" className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <TabsTrigger value="calculator" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Calculator</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Reports</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="calculator" className="mt-6">
            <CalculatorView
              systemPrompt={systemPrompt}
              setSystemPrompt={setSystemPrompt}
              userPrompt={userPrompt}
              setUserPrompt={setUserPrompt}
              outputTokens={outputTokens}
              setOutputTokens={setOutputTokens}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              callsPerMonth={callsPerMonth}
              setCallsPerMonth={setCallsPerMonth}
              geminiApiKey={geminiApiKey}
            />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
            <ReportsTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab
              geminiApiKey={geminiApiKey}
              updateGeminiApiKey={updateGeminiApiKey}
            />
          </TabsContent>
        </Tabs>

        <PrivacyBadge />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono text-base font-bold shadow-md shadow-indigo-500/20">
            T
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              TokenMetrics.ai
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              LLM Cost · Performance · Carbon
            </div>
          </div>
        </div>
        <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 font-medium">
          v1.1 · {MODELS.length} models
        </Badge>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="space-y-4 py-6">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-400 font-medium">
        <span>⚡ Infrastructure-aware benchmarking</span>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-indigo-200 to-slate-400 bg-clip-text text-transparent">
        The LLM Economics & Carbon Calculator
      </h1>
      <p className="max-w-3xl text-sm sm:text-base text-slate-400 leading-relaxed">
        Make data-driven decisions by benchmarking GPT, Claude, and Gemini side-by-side. 
        Evaluate financial cost, latency, energy usage, water consumption, and CO₂e emissions for any prompt instantly.
      </p>
    </section>
  );
}

function ReportsTab() {
  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-white">Reports Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-300">
        <p>
          Reports are generated dynamically on-demand from the Calculator tab. Click{" "}
          <span className="font-semibold text-indigo-400">Download report (PDF)</span> after
          running a comparison to export a clean, formatted report.
        </p>
        <p>
          Calculations and report generation are executed completely inside your browser using local resources. We never transfer your prompt text to external servers, securing your data privacy.
        </p>
      </CardContent>
    </Card>
  );
}

function SettingsTab({
  geminiApiKey,
  updateGeminiApiKey,
}: {
  geminiApiKey: string;
  updateGeminiApiKey: (key: string) => void;
}) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Environmental Multipliers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-slate-300">
          <Row label="PUE (datacenter energy overhead)" value={ENV.pue.toString()} />
          <Row label="WUE on-site (cooling)" value={`${ENV.wueOnSiteLPerKWh} L/kWh`} />
          <Row label="WUE electricity (generation)" value={`${ENV.wueElectricityLPerKWh} L/kWh`} />
          <Row label="Grid carbon intensity" value={`${ENV.co2IntensityGPerKWh} g/kWh`} />
          <p className="pt-4 text-[11px] text-slate-500 leading-normal">
            <strong>Data sources:</strong> {ENV.source}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">API configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-300">
          <p className="text-slate-400 text-xs">
            Provide your Gemini API key to activate the <strong>Gemini AI Advisor</strong>. This generates contextual, real-world comparison reports about your LLM footprint using AI.
          </p>
          <div className="space-y-2">
            <Label htmlFor="gg" className="text-xs font-semibold text-slate-300">Google AI / Gemini API Key</Label>
            <Input
              id="gg"
              type="password"
              value={geminiApiKey}
              onChange={(e) => updateGeminiApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="bg-slate-950 border-slate-850 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500 font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-500 leading-normal">
            Your API key is saved locally in your browser's <code>localStorage</code> and called directly. It is never transmitted to any other server.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 py-2.5 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-sm font-semibold text-indigo-300">{value}</span>
    </div>
  );
}

function PrivacyBadge() {
  return (
    <footer className="mt-16 border-t border-slate-800/80 pt-8 text-center">
      <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 px-3 py-1 font-medium text-xs">
        🛡️ Privacy-First Layout
      </Badge>
      <p className="mt-3 text-xs text-slate-500">
        All benchmarking and processing takes place client-side. We never store or train on your prompt data.
      </p>
      <p className="mt-1 text-[11px] text-slate-600">
        © {new Date().getFullYear()} TokenMetrics.ai · Open-source benchmarking
      </p>
    </footer>
  );
}
