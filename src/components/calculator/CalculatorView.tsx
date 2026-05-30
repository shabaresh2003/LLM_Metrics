import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Coins,
  Droplet,
  Sparkles,
  AlertTriangle,
  Loader2,
  Leaf,
  Zap,
  Check,
  FileText,
  Brain,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import {
  computeMetrics,
  formatNumber,
  formatUsd,
  MODELS,
  generateRelatableFacts,
  type MetricsResult,
  type ModelSpec,
} from "@/lib/metrics";
import { countTokens } from "@/lib/tokenize";
import { extractPdfText, estimateOutputTokens } from "@/lib/pdf";
import { downloadReport } from "./report";

const DEFAULT_SELECTED = [
  "gpt-4o",
  "claude-3-5-sonnet",
  "gemini-1.5-pro",
  "gpt-4o-mini",
  "gemini-1.5-flash",
];

interface Props {
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  userPrompt: string;
  setUserPrompt: (v: string) => void;
  outputTokens: number;
  setOutputTokens: (v: number) => void;
  selectedIds: string[];
  setSelectedIds: (v: string[]) => void;
  callsPerMonth: number;
  setCallsPerMonth: (v: number) => void;
  geminiApiKey?: string;
}

export function CalculatorView(props: Props) {
  const {
    systemPrompt,
    setSystemPrompt,
    userPrompt,
    setUserPrompt,
    outputTokens,
    setOutputTokens,
    selectedIds,
    setSelectedIds,
    callsPerMonth,
    setCallsPerMonth,
    geminiApiKey,
  } = props;

  const [playgroundLive, setPlaygroundLive] = useState(true);
  const [autoOutput, setAutoOutput] = useState(true);
  const [parsingPdf, setParsingPdf] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Gemini AI Advisor State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`.trim();

  const results = useMemo<MetricsResult[]>(() => {
    if (!playgroundLive && fullPrompt.length === 0) return [];
    return selectedIds
      .map((id) => MODELS.find((m) => m.id === id))
      .filter((m): m is ModelSpec => Boolean(m))
      .map((m) => {
        const inputTokens = countTokens(fullPrompt, m.encoding);
        return computeMetrics({ model: m, inputTokens, outputTokens });
      });
  }, [selectedIds, fullPrompt, outputTokens, playgroundLive]);

  // Auto-estimate output tokens from average input token count across selected models.
  useEffect(() => {
    if (!autoOutput) return;
    const selected = selectedIds
      .map((id) => MODELS.find((m) => m.id === id))
      .filter((m): m is ModelSpec => Boolean(m));
    if (selected.length === 0) return;
    const avgIn =
      selected.reduce((s, m) => s + countTokens(fullPrompt, m.encoding), 0) /
      selected.length;
    const est = estimateOutputTokens(Math.round(avgIn));
    if (est !== outputTokens) setOutputTokens(est);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOutput, fullPrompt, selectedIds]);

  const monthlyResults = useMemo(
    () =>
      results.map((r) => {
        const monthlyCost = r.costUsd * callsPerMonth;
        const monthlyWater = r.waterMl * callsPerMonth;
        const facts = generateRelatableFacts(monthlyCost, monthlyWater);
        return {
          ...r,
          monthlyCost,
          monthlyCo2: r.co2eG * callsPerMonth,
          monthlyWater,
          facts,
        };
      }),
    [results, callsPerMonth],
  );

  // Generate dynamic AI Insights via Gemini API
  const generateAiInsights = async () => {
    if (!geminiApiKey) {
      setAiError("Please provide a Gemini API key in the Settings tab first.");
      return;
    }
    setAiLoading(true);
    setAiError(null);
    setAiInsights(null);

    try {
      const selectedModelsText = monthlyResults
        .map((r) => {
          return `- **${r.model.displayName}** (${r.model.provider}): Cost/call: $${r.costUsd.toFixed(6)}, Monthly Cost: $${r.monthlyCost.toFixed(2)}, Water/call: ${r.waterMl.toFixed(1)} mL, Monthly Water: ${(r.monthlyWater / 1000).toFixed(1)} L, CO2e: ${r.co2eG.toFixed(3)}g, E2E Latency: ${r.e2eLatencyMs.toFixed(0)}ms.`;
        })
        .join("\n");

      const promptText = `Analyze the following LLM metrics comparison for a monthly workload of ${callsPerMonth.toLocaleString()} runs. Each run has ${monthlyResults[0]?.inputTokens || 0} input tokens and ${outputTokens} output tokens.
      
Workload comparison data:
${selectedModelsText}

As an expert Cloud Economics & Sustainable AI Architect, provide a concise and highly actionable evaluation report in clean Markdown.
Structure your report with:
- **Cost vs. Performance Trade-off**: Which models offer the best value?
- **Environmental Impact Assessment**: Analyze the water & carbon footprints.
- **Relatable Real-World Facts**: Give 2-3 extremely creative, funny, or mind-blowing real-world analogies (e.g. comparing the total cost to developer salaries, coffee, subscriptions, or water usage to bathtubs, cotton T-shirts, or household drinking needs).
Keep the response engaging, fact-oriented, and relatively brief (around 250-350 words).`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}. Please check your API key.`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error("No insights could be generated. Please try again.");
      }
      setAiInsights(text);
      toast.success("AI Insights generated successfully!");
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "Failed to communicate with Gemini API.");
      toast.error("Failed to generate AI Insights");
    } finally {
      setAiLoading(false);
    }
  };

  function toggleModel(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  async function handleFile(file: File) {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const maxSize = isPdf ? 10 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large (max ${isPdf ? "10MB" : "2MB"})`);
      return;
    }
    try {
      if (isPdf) {
        setParsingPdf(true);
        const text = await extractPdfText(file);
        setUserPrompt(text);
        toast.success(`Extracted ${text.length.toLocaleString()} chars from ${file.name}`);
      } else {
        const text = await file.text();
        setUserPrompt(text);
        toast.success(`Loaded ${file.name}`);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to read ${file.name}`);
    } finally {
      setParsingPdf(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Input controls & Settings Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-white">Prompt Playground</CardTitle>
              <p className="mt-1 text-xs text-slate-400">
                Paste system rules and user prompts, or upload files. Token count updates live.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="live" className="text-xs text-slate-400 font-medium">
                Live
              </Label>
              <Switch id="live" checked={playgroundLive} onCheckedChange={setPlaygroundLive} className="data-[state=checked]:bg-indigo-600" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="system" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5 text-indigo-400" /> System Prompt
              </Label>
              <Textarea
                id="system"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant…"
                className="min-h-[80px] font-mono text-sm bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="user" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-indigo-400" /> User content
                </Label>
                <div className="flex gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".txt,.md,.json,.csv,.log,.pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleFile(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={parsingPdf}
                    onClick={() => fileRef.current?.click()}
                    className="border-slate-800 text-xs hover:bg-slate-800 hover:text-white"
                  >
                    {parsingPdf ? "Parsing PDF…" : "Upload TXT / PDF"}
                  </Button>
                </div>
              </div>
              <Textarea
                id="user"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Paste your prompt or document here…"
                className="min-h-[220px] font-mono text-sm bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500"
              />
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400 font-medium">
                  Length: <span className="text-indigo-400 font-semibold">{fullPrompt.length.toLocaleString()}</span> characters
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold text-white">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="out" className="text-xs font-semibold text-slate-300">
                  Expected Output Tokens
                </Label>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="auto-out" className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Auto-est
                  </Label>
                  <Switch id="auto-out" checked={autoOutput} onCheckedChange={setAutoOutput} className="data-[state=checked]:bg-indigo-600" />
                </div>
              </div>
              <Input
                id="out"
                type="number"
                min={0}
                value={outputTokens}
                onChange={(e) => {
                  setAutoOutput(false);
                  setOutputTokens(Math.max(0, Number(e.target.value) || 0));
                }}
                className="font-mono bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500"
              />
              {autoOutput && (
                <p className="text-[11px] text-slate-400 italic">
                  Estimated automatically from your prompt size.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="calls" className="text-xs font-semibold text-slate-300">
                Workload: Runs / Month
              </Label>
              <Input
                id="calls"
                type="number"
                min={0}
                value={callsPerMonth}
                onChange={(e) => setCallsPerMonth(Math.max(0, Number(e.target.value) || 0))}
                className="font-mono bg-slate-950 border-slate-800 text-slate-100 focus-visible:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400">
                Used to scale query metrics to monthly projections.
              </p>
            </div>

            <Separator className="border-slate-800" />

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-indigo-400" /> Selected Models ({selectedIds.length})
              </Label>
              <div className="grid max-h-[220px] grid-cols-1 gap-1.5 overflow-y-auto pr-1">
                {MODELS.map((m) => {
                  const active = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleModel(m.id)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition duration-200 ${
                        active
                          ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                          : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-900/60"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{m.displayName}</div>
                        <div className="text-[10px] text-slate-400">{m.provider}</div>
                      </div>
                      <Badge variant={active ? "default" : "secondary"} className={`text-[9px] font-semibold tracking-wide ${active ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                        {m.class}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Side-by-Side Table Card */}
      <ComparisonTable results={monthlyResults} callsPerMonth={callsPerMonth} />

      {/* New Section: Real-World Relatable Impacts & Gemini AI Advisor */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Relatable Facts Panel */}
        <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-400" /> Real-World Impact Translator
            </CardTitle>
            <p className="text-xs text-slate-400">
              Comparing abstract metrics into relatable physical, economic, and human-scale concepts.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            {monthlyResults.length === 0 ? (
              <div className="text-center text-sm py-12 text-slate-500 border border-dashed border-slate-800 rounded-lg">
                Select models and configure prompt inputs to translate footprints.
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {monthlyResults.map((r) => (
                  <div key={r.model.id} className="border border-slate-800/80 bg-slate-950/30 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{r.model.displayName}</span>
                      <Badge className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 text-[9px]">
                        {r.model.provider}
                      </Badge>
                    </div>
                    <div className="grid gap-2.5 sm:grid-cols-2 pt-1 text-xs">
                      <div className="bg-indigo-950/20 border border-indigo-950/30 rounded-lg p-2.5 flex items-start gap-2">
                        <Coins className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-300">Cost: {formatUsd(r.monthlyCost)}/mo</div>
                          <div className="text-slate-400 text-[11px] leading-tight mt-0.5">{r.facts.costFact}</div>
                        </div>
                      </div>
                      <div className="bg-cyan-950/20 border border-cyan-950/30 rounded-lg p-2.5 flex items-start gap-2">
                        <Droplet className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-slate-300">Water: {formatNumber(r.monthlyWater / 1000, 1)} L/mo</div>
                          <div className="text-slate-400 text-[11px] leading-tight mt-0.5">{r.facts.waterFact}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gemini AI Advisor Panel */}
        <Card className="bg-slate-900 border-indigo-500/20 shadow-xl flex flex-col justify-between shadow-indigo-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" /> Gemini AI Advisor
            </CardTitle>
            <p className="text-xs text-slate-400">
              Generate dynamic, context-specific trade-off assessments and environmental offsets using AI.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 flex-1 flex flex-col justify-between min-h-[300px]">
            {aiInsights ? (
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex-1 overflow-y-auto max-h-[320px]">
                <SimpleMarkdown text={aiInsights} />
              </div>
            ) : aiLoading ? (
              <div className="flex flex-col items-center justify-center py-16 flex-1 text-slate-400 space-y-3">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                <div className="text-sm font-semibold">Gemini is analyzing your LLM footprint...</div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 flex-1 text-center space-y-4 border border-dashed border-slate-800 rounded-lg">
                <Brain className="h-10 w-10 text-slate-600" />
                <div>
                  <div className="text-sm font-bold text-slate-300">Unlock Intelligent Advisory Report</div>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Provide your Gemini API key in settings to request an automated audit of your models, complete with offset ideas and trade-offs.
                  </p>
                </div>
              </div>
            )}

            {aiError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg p-3 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800/80 mt-auto flex justify-between items-center gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                {geminiApiKey ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> API Key Configured
                  </span>
                ) : (
                  <span className="text-slate-500">No API Key added</span>
                )}
              </div>
              <Button
                onClick={generateAiInsights}
                disabled={aiLoading || !geminiApiKey || monthlyResults.length === 0}
                className="bg-indigo-600 text-white hover:bg-indigo-500 font-semibold disabled:bg-slate-800 disabled:text-slate-600 gap-1.5 shadow-md shadow-indigo-600/10"
              >
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate AI Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CostVsEcoChart results={results} />
        <PerModelBars results={results} />
      </div>

      {/* Footer controls */}
      <div className="flex justify-between items-center border-t border-slate-800/80 pt-6">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Benchmarked locally using <strong>Web Cryptography</strong> and native packages.</span>
        </div>
        <Button
          onClick={() =>
            downloadReport({
              systemPrompt,
              userPrompt,
              outputTokens,
              callsPerMonth,
              results: monthlyResults,
            })
          }
          className="bg-slate-800 text-slate-100 hover:bg-slate-700 font-bold border border-slate-700"
        >
          Download Report (PDF)
        </Button>
      </div>
    </div>
  );
}

function ComparisonTable({
  results,
  callsPerMonth,
}: {
  results: (MetricsResult & { monthlyCost: number; monthlyCo2: number; monthlyWater: number; facts: { costFact: string; waterFact: string } })[];
  callsPerMonth: number;
}) {
  const best = useMemo(() => {
    if (results.length === 0) return { cost: null, co2: null, latency: null } as const;
    const cheapest = [...results].sort((a, b) => a.costUsd - b.costUsd)[0];
    const greenest = [...results].sort((a, b) => a.co2eG - b.co2eG)[0];
    const fastest = [...results].sort((a, b) => a.e2eLatencyMs - b.e2eLatencyMs)[0];
    return {
      cost: cheapest.model.id,
      co2: greenest.model.id,
      latency: fastest.model.id,
    } as const;
  }, [results]);

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-400" /> Side-by-Side Benchmarking
        </CardTitle>
        <p className="mt-1 text-xs text-slate-400">
          Per-request metrics. Monthly projections scale by {callsPerMonth.toLocaleString()} runs.
        </p>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto border-t border-slate-800/80">
          <Table>
            <TableHeader className="bg-slate-950/40">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-300 font-semibold h-11">Model</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">Input Tok</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">Output Tok</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">Cost / Call</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">Monthly Cost</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">Energy (Wh)</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">Water (mL)</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">CO₂e (g)</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">TTFT</TableHead>
                <TableHead className="text-right text-slate-300 font-semibold h-11">E2E</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-10 text-sm text-slate-500">
                    Select at least one model and enter a prompt.
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r) => (
                  <TableRow key={r.model.id} className="border-slate-800 hover:bg-slate-900/30 transition">
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-sm">{r.model.displayName}</span>
                          {best.cost === r.model.id && (
                            <Badge className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-semibold h-5 px-1.5">
                              cheapest
                            </Badge>
                          )}
                          {best.co2 === r.model.id && (
                            <Badge className="bg-green-600/10 text-green-400 border border-green-500/20 text-[9px] font-semibold h-5 px-1.5">
                              greenest
                            </Badge>
                          )}
                          {best.latency === r.model.id && (
                            <Badge className="bg-sky-600/10 text-sky-400 border border-sky-500/20 text-[9px] font-semibold h-5 px-1.5">
                              fastest
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 leading-none">{r.model.provider}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-300">
                      {r.inputTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-300">
                      {r.outputTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-100">{formatUsd(r.costUsd)}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-indigo-300">{formatUsd(r.monthlyCost)}</TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-300">
                      {formatNumber(r.facilityEnergyWh, 3)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-300">
                      {formatNumber(r.waterMl, 1)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-300">
                      {formatNumber(r.co2eG, 3)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-300">{r.ttftMs} ms</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-100">
                      {formatNumber(r.e2eLatencyMs, 0)} ms
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

const CHART_COLORS = [
  "#6366f1", // indigo
  "#10b981", // emerald
  "#d946ef", // fuchsia
  "#06b6d4", // cyan
  "#f97316", // orange
  "#8b5cf6", // violet
  "#f43f5e", // rose
  "#eab308", // yellow
  "#14b8a6", // teal
];

function CostVsEcoChart({ results }: { results: MetricsResult[] }) {
  const data = results.map((r, i) => ({
    name: r.model.displayName,
    cost: Number(r.costUsd.toFixed(6)),
    co2: Number(r.co2eG.toFixed(4)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader>
        <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
          <Leaf className="h-4.5 w-4.5 text-emerald-400" /> Cost vs. Eco-Efficiency
        </CardTitle>
        <p className="mt-1 text-xs text-slate-400">
          Bottom-left is best: low cost, low carbon emissions.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 25, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                type="number"
                dataKey="cost"
                name="Cost"
                tickFormatter={(v) => formatUsd(v)}
                stroke="#64748b"
                fontSize={10}
                label={{ value: "Cost / call (USD)", position: "insideBottom", offset: -15, fontSize: 10, fill: "#94a3b8" }}
              />
              <YAxis
                type="number"
                dataKey="co2"
                name="CO₂e"
                stroke="#64748b"
                fontSize={10}
                label={{ value: "CO₂e (g)", angle: -90, position: "insideLeft", fontSize: 10, fill: "#94a3b8" }}
              />
              <RTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur p-2.5 text-xs shadow-lg">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="font-mono text-slate-300 mt-1 flex flex-col gap-0.5">
                        <span className="text-indigo-400">Cost: {formatUsd(p.cost)}</span>
                        <span className="text-emerald-400">Emissions: {p.co2} g CO₂e</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Scatter data={data}>
                {data.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function PerModelBars({ results }: { results: MetricsResult[] }) {
  const data = results.map((r) => ({
    name: r.model.displayName.replace("Claude ", "").replace("Gemini ", ""),
    Cost: Number((r.costUsd * 1000).toFixed(4)),
    Energy: Number(r.facilityEnergyWh.toFixed(4)),
  }));

  return (
    <Card className="bg-slate-900 border-slate-800 shadow-xl">
      <CardHeader>
        <CardTitle className="text-base font-bold text-white flex items-center gap-1.5">
          <TrendingDown className="h-4.5 w-4.5 text-indigo-400" /> Cost vs Energy
        </CardTitle>
        <p className="mt-1 text-xs text-slate-400">Comparing Cost (¢/1k calls) against Facility Energy (Wh/call).</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={9} angle={-25} textAnchor="end" height={50} />
              <YAxis stroke="#64748b" fontSize={10} />
              <RTooltip
                contentStyle={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid #334155",
                  borderRadius: "12px",
                  fontSize: 11,
                  color: "#f8fafc",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              <Bar dataKey="Cost" fill="#6366f1" name="Cost (¢/1k calls)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Energy" fill="#10b981" name="Energy (Wh/call)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Lightweight Custom Markdown Parser for rendering Gemini responses
function SimpleMarkdown({ text }: { text: string }) {
  const paragraphs = text.split("\n\n");
  return (
    <div className="space-y-4 text-slate-350 text-xs leading-relaxed">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        if (trimmed.startsWith("### ")) {
          return (
            <h4
              key={i}
              className="text-sm font-bold text-white mt-4 border-b border-slate-800 pb-1 flex items-center gap-1.5"
              dangerouslySetInnerHTML={{ __html: parseBold(trimmed.substring(4)) }}
            />
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <h3
              key={i}
              className="text-base font-bold text-indigo-400 mt-4 border-b border-indigo-950 pb-1"
              dangerouslySetInnerHTML={{ __html: parseBold(trimmed.substring(3)) }}
            />
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split(/\n[-*] /).filter(Boolean);
          return (
            <ul key={i} className="list-disc pl-5 space-y-1.5 text-slate-300">
              {items.map((item, idx) => {
                const cleaned = item.replace(/^[-*]\s+/, "");
                return (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: parseBold(cleaned) }} />
                );
              })}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className="text-slate-300"
            dangerouslySetInnerHTML={{ __html: parseBold(trimmed) }}
          />
        );
      })}
    </div>
  );
}

function parseBold(t: string): string {
  return t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

export { DEFAULT_SELECTED };