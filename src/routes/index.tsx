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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors position="top-right" />
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Hero />
        <Tabs defaultValue="calculator" className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
            />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
            <ReportsTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>

        <PrivacyBadge />
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-sm font-bold">
            T
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">TokenMetrics.ai</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              LLM cost · performance · carbon
            </div>
          </div>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex">
          v1.0 · {MODELS.length} models
        </Badge>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        The LLM economics calculator
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground">
        Compare GPT, Claude and Gemini side-by-side on cost, latency, energy, water
        and CO₂ equivalent emissions. Paste a prompt, pick your models, and tune
        the system prompt live in the Playground.
      </p>
    </section>
  );
}

function ReportsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Reports are generated on-demand from the Calculator tab. Click{" "}
          <span className="font-medium text-foreground">Download report</span> after
          running a comparison to export a printable PDF (via your browser's print
          dialog → Save as PDF).
        </p>
        <p className="text-muted-foreground">
          Nothing is uploaded to a server — reports are built entirely in your browser.
        </p>
      </CardContent>
    </Card>
  );
}

function SettingsTab() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Environmental model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="PUE (datacenter overhead)" value={ENV.pue.toString()} />
          <Row label="WUE on-site" value={`${ENV.wueOnSiteLPerKWh} L/kWh`} />
          <Row label="WUE electricity" value={`${ENV.wueElectricityLPerKWh} L/kWh`} />
          <Row label="Grid carbon intensity" value={`${ENV.co2IntensityGPerKWh} g/kWh`} />
          <p className="pt-2 text-xs text-muted-foreground">{ENV.source}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">API keys (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Keys are not required for the calculator. If you'd like to wire up live
            inference, configure these on the server via environment variables.
          </p>
          <div className="space-y-2">
            <Label htmlFor="oa" className="text-xs">OpenAI API key</Label>
            <Input id="oa" type="password" placeholder="sk-…" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="an" className="text-xs">Anthropic API key</Label>
            <Input id="an" type="password" placeholder="sk-ant-…" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gg" className="text-xs">Google AI key</Label>
            <Input id="gg" type="password" placeholder="AIza…" disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Connect Lovable Cloud to securely store keys server-side.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

function PrivacyBadge() {
  return (
    <footer className="mt-12 border-t border-border/60 pt-6 text-center">
      <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
        Privacy-first · We never store or train on your prompts
      </Badge>
      <p className="mt-3 text-xs text-muted-foreground">
        All calculations run locally in your browser. © {new Date().getFullYear()} TokenMetrics.ai
      </p>
    </footer>
  );
}
