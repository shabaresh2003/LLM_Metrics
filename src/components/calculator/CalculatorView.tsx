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
  } = props;

  const [playgroundLive, setPlaygroundLive] = useState(true);
  const [autoOutput, setAutoOutput] = useState(true);
  const [parsingPdf, setParsingPdf] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      results.map((r) => ({
        ...r,
        monthlyCost: r.costUsd * callsPerMonth,
        monthlyCo2: r.co2eG * callsPerMonth,
        monthlyWater: r.waterMl * callsPerMonth,
      })),
    [results, callsPerMonth],
  );

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
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Prompt input</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Paste content or upload a .txt / .md file. Token counts update live.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="live" className="text-xs text-muted-foreground">
                Live
              </Label>
              <Switch id="live" checked={playgroundLive} onCheckedChange={setPlaygroundLive} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="system" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                System prompt
              </Label>
              <Textarea
                id="system"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant…"
                className="mt-1.5 min-h-[80px] font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="user" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  User content
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
                  <Button size="sm" variant="outline" disabled={parsingPdf} onClick={() => fileRef.current?.click()}>
                    {parsingPdf ? "Parsing PDF…" : "Upload file / PDF"}
                  </Button>
                </div>
              </div>
              <Textarea
                id="user"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Paste your prompt or document here…"
                className="mt-1.5 min-h-[200px] font-mono text-sm"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {fullPrompt.length.toLocaleString()} characters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="out" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Expected output tokens
                </Label>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor="auto-out" className="text-[10px] text-muted-foreground">
                    Auto
                  </Label>
                  <Switch id="auto-out" checked={autoOutput} onCheckedChange={setAutoOutput} />
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
                className="mt-1.5 font-mono"
              />
              {autoOutput && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Estimated automatically from your prompt length.
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="calls" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Calls per month
              </Label>
              <Input
                id="calls"
                type="number"
                min={0}
                value={callsPerMonth}
                onChange={(e) => setCallsPerMonth(Math.max(0, Number(e.target.value) || 0))}
                className="mt-1.5 font-mono"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Used for monthly projections.
              </p>
            </div>
            <Separator />
            <div>
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Models ({selectedIds.length}/{MODELS.length})
              </Label>
              <div className="mt-2 grid max-h-[260px] grid-cols-1 gap-1 overflow-y-auto pr-1">
                {MODELS.map((m) => {
                  const active = selectedIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleModel(m.id)}
                      className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-background hover:bg-muted"
                      }`}
                    >
                      <div>
                        <div className="font-medium">{m.displayName}</div>
                        <div className="text-xs text-muted-foreground">{m.provider}</div>
                      </div>
                      <Badge variant={active ? "default" : "secondary"} className="text-[10px]">
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

      <ComparisonTable results={monthlyResults} callsPerMonth={callsPerMonth} />

      <div className="grid gap-6 lg:grid-cols-2">
        <CostVsEcoChart results={results} />
        <PerModelBars results={results} />
      </div>

      <div className="flex justify-end">
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
        >
          Download report (PDF)
        </Button>
      </div>
    </div>
  );
}

function ComparisonTable({
  results,
  callsPerMonth,
}: {
  results: (MetricsResult & { monthlyCost: number; monthlyCo2: number; monthlyWater: number })[];
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Side-by-side comparison</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Per-request metrics. Monthly columns scale by {callsPerMonth.toLocaleString()} calls.
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Input tok</TableHead>
                <TableHead className="text-right">Output tok</TableHead>
                <TableHead className="text-right">Cost / call</TableHead>
                <TableHead className="text-right">Monthly cost</TableHead>
                <TableHead className="text-right">Energy (Wh)</TableHead>
                <TableHead className="text-right">Water (mL)</TableHead>
                <TableHead className="text-right">CO₂e (g)</TableHead>
                <TableHead className="text-right">TTFT</TableHead>
                <TableHead className="text-right">E2E</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">
                    Select at least one model and enter a prompt.
                  </TableCell>
                </TableRow>
              ) : (
                results.map((r) => (
                  <TableRow key={r.model.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{r.model.displayName}</span>
                        {best.cost === r.model.id && (
                          <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                            cheapest
                          </Badge>
                        )}
                        {best.co2 === r.model.id && (
                          <Badge variant="outline" className="border-green-500/40 text-green-700 dark:text-green-400">
                            greenest
                          </Badge>
                        )}
                        {best.latency === r.model.id && (
                          <Badge variant="outline" className="border-sky-500/40 text-sky-700 dark:text-sky-400">
                            fastest
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.model.provider}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.inputTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.outputTokens.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatUsd(r.costUsd)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{formatUsd(r.monthlyCost)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(r.facilityEnergyWh, 3)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(r.waterMl, 2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatNumber(r.co2eG, 3)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{r.ttftMs} ms</TableCell>
                    <TableCell className="text-right font-mono text-sm">
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
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#10b981",
];

function CostVsEcoChart({ results }: { results: MetricsResult[] }) {
  const data = results.map((r, i) => ({
    name: r.model.displayName,
    cost: Number(r.costUsd.toFixed(6)),
    co2: Number(r.co2eG.toFixed(4)),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Cost vs. eco-efficiency</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Bottom-left is best: low cost, low emissions.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis
                type="number"
                dataKey="cost"
                name="Cost"
                tickFormatter={(v) => formatUsd(v)}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                label={{ value: "Cost / call (USD)", position: "insideBottom", offset: -15, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="co2"
                name="CO₂e"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                label={{ value: "CO₂e (g)", angle: -90, position: "insideLeft", fontSize: 11 }}
              />
              <RTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-md border bg-background p-2 text-xs shadow-sm">
                      <div className="font-medium">{p.name}</div>
                      <div className="font-mono">{formatUsd(p.cost)} · {p.co2} g CO₂e</div>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Cost (¢/1k) vs Energy (Wh)</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">Per-request breakdown by model.</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} angle={-25} textAnchor="end" height={50} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <RTooltip
                contentStyle={{
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Cost" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Energy" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Default exports used by index route
export { DEFAULT_SELECTED };