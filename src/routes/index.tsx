import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  CalculatorView,
  DEFAULT_SELECTED,
} from "@/components/calculator/CalculatorView";
import { ENV, MODELS } from "@/lib/metrics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoMetrics.ai — LLM cost, performance & carbon calculator" },
      {
        name: "description",
        content:
          "Compare GPT, Claude and Gemini on cost, latency, energy, water and CO₂e for any prompt. Side-by-side LLM benchmarking with a downloadable report.",
      },
      { name: "keywords", content: "LLM cost calculator, GPT vs Claude vs Gemini, AI carbon footprint, token counter, tiktoken, AI energy water" },
      { property: "og:title", content: "EcoMetrics.ai — LLM cost & carbon calculator" },
      { property: "og:description", content: "Compare GPT, Claude and Gemini on cost, latency and environmental impact." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "EcoMetrics.ai" },
      { name: "twitter:description", content: "LLM cost, performance & carbon calculator." },
      { rel: "canonical", href: "/" } as never,
    ],
  }),
  component: Index,
});

/* ─────────────────────────────────────────────────────────────────────────────
   Scroll-reveal hook
───────────────────────────────────────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    const elements = document.querySelectorAll(
      ".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right"
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Animated counter hook
───────────────────────────────────────────────────────────────────────────── */
function useCounter(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Root Page Component
───────────────────────────────────────────────────────────────────────────── */
function Index() {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful assistant. Answer concisely."
  );
  const [userPrompt, setUserPrompt] = useState(
    "Summarize the key risks of deploying large language models in production."
  );
  const [outputTokens, setOutputTokens] = useState(256);
  const [selectedIds, setSelectedIds] = useState<string[]>(DEFAULT_SELECTED);
  const [callsPerMonth, setCallsPerMonth] = useState(10000);

  useScrollReveal();

  return (
    <>
      {/* ── Hero ── */}
      <HeroSection />

      {/* ── User Journey / Storytelling ── */}
      <UserJourneySection />

      {/* ── Feature Showcase ── */}
      <FeatureShowcaseSection />

      {/* ── Live Stats ── */}
      <LiveStatsSection />

      {/* ── Calculator (anchor target) ── */}
      <section id="calculator" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10 scroll-reveal">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs text-indigo-400 font-medium mb-4">
            ⚡ Live Calculator
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl mb-3">
            Try it for yourself
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Paste your prompt and instantly see cost, carbon, water, and energy across every major LLM.
          </p>
        </div>

        <Tabs defaultValue="calculator" className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-slate-900 border border-slate-800 p-1 rounded-lg mx-auto">
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
            />
          </TabsContent>
          <TabsContent value="reports" className="mt-6">
            <ReportsTab />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </section>

      <EnhancedFooter />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────


/* ─────────────────────────────────────────────────────────────────────────────
   Hero Section  (with cinematic background video)
───────────────────────────────────────────────────────────────────────────── */
function HeroSection() {
  const [typedText, setTypedText] = useState("");
  const [muted, setMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const phrases = [
    "every API call.",
    "every commute you make.",
    "every model you choose.",
    "your personal carbon footprint.",
    "your AI water usage.",
  ];
  const phraseIndex = useRef(0);
  const charIndex = useRef(0);
  const deleting = useRef(false);

  /* Typewriter */
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const type = () => {
      const current = phrases[phraseIndex.current];
      if (!deleting.current) {
        setTypedText(current.slice(0, charIndex.current + 1));
        charIndex.current++;
        if (charIndex.current === current.length) {
          deleting.current = true;
          timeout = setTimeout(type, 2000);
          return;
        }
      } else {
        setTypedText(current.slice(0, charIndex.current - 1));
        charIndex.current--;
        if (charIndex.current === 0) {
          deleting.current = false;
          phraseIndex.current = (phraseIndex.current + 1) % phrases.length;
        }
      }
      timeout = setTimeout(type, deleting.current ? 40 : 65);
    };
    timeout = setTimeout(type, 600);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  return (
    <section className="relative min-h-[96vh] flex flex-col items-center justify-center overflow-hidden px-4 text-center">

      {/* ── Cinematic background video ── */}
      {!videoError && (
        <div className="absolute inset-0 z-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            onError={() => setVideoError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "brightness(0.22) saturate(1.4)" }}
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>

          {/* Dark vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/30 to-slate-950/80" />
          {/* Side vignettes */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-transparent to-slate-950/70" />
          {/* Purple tint layer */}
          <div className="absolute inset-0 bg-indigo-950/20" />

          {/* Mute / unmute control */}
          <button
            onClick={toggleMute}
            title={muted ? "Unmute video" : "Mute video"}
            className="absolute bottom-6 right-6 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-900/60 backdrop-blur px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            {muted ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
                Unmute
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
                Mute
              </>
            )}
          </button>
        </div>
      )}

      {/* Fallback: CSS glows when video fails */}
      {videoError && (
        <div className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px] animate-float-slow" />
          <div className="absolute bottom-[-5%] left-1/4 w-[500px] h-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[80px] animate-float" />
        </div>
      )}

      {/* Floating code snippets — decorative */}
      <div className="pointer-events-none absolute left-8 top-1/4 hidden xl:block animate-float opacity-40 z-10" style={{ animationDelay: "1s" }}>
        <pre className="text-[11px] text-indigo-300 font-mono border border-indigo-500/30 rounded-lg px-3 py-2 bg-slate-900/70 backdrop-blur-sm">
{`const cost = tokens * price_per_1m
// $0.0024 per call`}
        </pre>
      </div>
      <div className="pointer-events-none absolute right-8 top-1/3 hidden xl:block animate-float opacity-40 z-10" style={{ animationDelay: "3s" }}>
        <pre className="text-[11px] text-emerald-300 font-mono border border-emerald-500/30 rounded-lg px-3 py-2 bg-slate-900/70 backdrop-blur-sm">
{`CO₂e: 0.42g per request
Water: 12ml consumed`}
        </pre>
      </div>
      <div className="pointer-events-none absolute right-12 bottom-1/3 hidden xl:block animate-float opacity-35 z-10" style={{ animationDelay: "2s" }}>
        <pre className="text-[11px] text-cyan-300 font-mono border border-cyan-500/30 rounded-lg px-3 py-2 bg-slate-900/70 backdrop-blur-sm">
{`GPT-4o    $2.50/1M
Claude 3.5 $3.00/1M
Gemini 1.5 $1.25/1M`}
        </pre>
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/15 backdrop-blur px-4 py-1.5 text-xs text-indigo-200 font-medium mb-8 animate-pulse-glow">
          <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
          Infrastructure-aware LLM benchmarking · 100% Client-Side & Private
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 drop-shadow-2xl">
          <span className="gradient-text-hero block">Know the true cost of</span>
          <span className="text-white block mt-2 min-h-[1.2em]">
            <span className="gradient-text-accent cursor-blink">{typedText}</span>
          </span>
        </h1>

        {/* Sub */}
        <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto mb-10 drop-shadow">
          Track and optimize your impact in two ways: Our <span className="text-white font-semibold">LLM Benchmarker</span> compares AI models across cost and efficiency. Our <span className="text-emerald-300 font-semibold">Personal Carbon Tracker</span> uses Gemini AI to give personalized life-style insights. All 100% private.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center mb-14">
          <Link to="/carbon-tracker">
            <Button
              size="lg"
              className="step-badge bg-emerald-600 text-white font-semibold text-base px-8 py-3 h-auto rounded-xl hover:bg-emerald-500 transition-opacity shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
            >
              🌍 Personal Carbon Tracker
            </Button>
          </Link>
          <a href="#calculator">
            <Button
              variant="outline"
              size="lg"
              className="border-indigo-500/30 text-indigo-300 hover:border-indigo-400 hover:text-white font-semibold text-base px-8 py-3 h-auto rounded-xl transition-all bg-indigo-950/40 backdrop-blur"
            >
              ⚡ LLM Calculator
            </Button>
          </a>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
          {[
            { icon: "🛡️", label: "100% client-side" },
            { icon: "🔓", label: "Open source" },
            { icon: "🤖", label: `${MODELS.length}+ LLM models` },
            { icon: "📊", label: "6 metrics tracked" },
            { icon: "📄", label: "PDF reports" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 drop-shadow">
              <span>{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600 animate-bounce">
        <span className="text-xs">scroll</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   User Journey / Storytelling Section
───────────────────────────────────────────────────────────────────────────── */
const JOURNEY_STEPS = [
  {
    number: "01",
    emoji: "✍️",
    title: "Enter your prompt",
    subtitle: "Your words. Your use case.",
    description:
      "Paste your system prompt and user message — exactly as you'd call the API. No sign-up, no data sent to any server. Everything stays in your browser.",
    code: `system: "You are a helpful assistant."
user: "Summarize key risks of LLMs in prod."`,
    codeColor: "text-indigo-300",
    codeBorder: "border-indigo-500/20",
    accent: "from-indigo-500 to-violet-500",
    glowColor: "rgba(99,102,241,0.15)",
  },
  {
    number: "02",
    emoji: "🔢",
    title: "We tokenize & count",
    subtitle: "Precise token counting, client-side.",
    description:
      "Using the same tiktoken library as OpenAI, we measure your exact input and estimated output token count. No approximations. No black boxes.",
    code: `Input tokens:   87
Output tokens: 256
Total:         343 tokens`,
    codeColor: "text-cyan-300",
    codeBorder: "border-cyan-500/20",
    accent: "from-cyan-500 to-blue-500",
    glowColor: "rgba(6,182,212,0.12)",
  },
  {
    number: "03",
    emoji: "⚖️",
    title: "Compare 10+ models side-by-side",
    subtitle: "Apples-to-apples. No spin.",
    description:
      "GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro and more — ranked by cost, latency, energy, water, and CO₂ emissions. All calculated at your actual scale.",
    code: `GPT-4o        $0.0024  ⚡ 1.2s
Claude 3.5    $0.0029  ⚡ 0.9s
Gemini 1.5    $0.0012  ⚡ 1.4s`,
    codeColor: "text-emerald-300",
    codeBorder: "border-emerald-500/20",
    accent: "from-emerald-500 to-teal-500",
    glowColor: "rgba(16,185,129,0.12)",
  },
  {
    number: "04",
    emoji: "📊",
    title: "Get your Smart Advisor report",
    subtitle: "Data + story + recommendations.",
    description:
      "Our local Smart Advisor generates relatable insights — \"This month's LLM spend equals 5 developer salaries\" — plus actionable optimization recommendations and a downloadable PDF.",
    code: `💡 Switching to Gemini Flash
   saves $847/mo at your scale.
💧 Water: 120L = 2 bathtubs.`,
    codeColor: "text-violet-300",
    codeBorder: "border-violet-500/20",
    accent: "from-violet-500 to-pink-500",
    glowColor: "rgba(139,92,246,0.15)",
  },
];

function UserJourneySection() {
  return (
    <section id="how-it-works" className="relative py-24 px-4">
      {/* Section heading */}
      <div className="text-center mb-16 scroll-reveal">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs text-violet-300 font-medium mb-4">
          🗺️ Your journey
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          From prompt to insight
          <br />
          <span className="gradient-text-accent">in under 3 seconds</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto">
          Here's exactly how EcoMetrics.ai transforms a raw API call into a clear, actionable intelligence report.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto space-y-6">
        {JOURNEY_STEPS.map((step, i) => (
          <JourneyStep key={step.number} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}

function JourneyStep({
  step,
  index,
}: {
  step: (typeof JOURNEY_STEPS)[0];
  index: number;
}) {
  const isEven = index % 2 === 0;
  const revealClass = isEven ? "scroll-reveal-left" : "scroll-reveal-right";

  return (
    <div
      className={`${revealClass} glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 hover:border-white/15 hover:scale-[1.01]`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${isEven ? "top left" : "top right"}, ${step.glowColor} 0%, transparent 60%)`,
        }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start">
        {/* Step badge */}
        <div className="shrink-0">
          <div className={`step-badge text-white text-2xl rounded-2xl flex flex-col items-center justify-center w-16 h-16 font-black bg-gradient-to-br ${step.accent} shadow-lg`}>
            {step.emoji}
          </div>
          <div className="text-center mt-2 font-mono text-xs font-bold text-slate-600">{step.number}</div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{step.subtitle}</div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{step.title}</h3>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-4">{step.description}</p>

          {/* Code preview */}
          <div className={`rounded-xl border ${step.codeBorder} bg-slate-950/60 px-4 py-3`}>
            <pre className={`text-xs sm:text-sm font-mono ${step.codeColor} whitespace-pre-wrap leading-relaxed`}>
              {step.code}
            </pre>
          </div>
        </div>

        {/* Step number watermark */}
        <div className="hidden lg:block absolute right-6 top-6 font-black text-7xl text-white/[0.025] select-none leading-none">
          {step.number}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Feature Showcase Section
───────────────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "💰",
    title: "Cost Intelligence",
    description:
      "See exactly what each model charges per million tokens — input, output, and cache reads. Then project that to your actual monthly call volume. No surprises at the billing cycle.",
    highlight: "Up to 60% cheaper alternatives surfaced",
    accent: "from-yellow-500/20 to-orange-500/10",
    border: "hover:border-yellow-500/40",
    tag: "Financial",
    tagColor: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  },
  {
    icon: "🌍",
    title: "Environmental Impact",
    description:
      "Track water consumption, energy usage, and CO₂ emissions per request — then contextualize them with relatable real-world facts computed 100% locally. Not just numbers — stories.",
    highlight: "6 environmental metrics in one view",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "hover:border-emerald-500/40",
    tag: "Sustainability",
    tagColor: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  },
  {
    icon: "🤖",
    title: "Smart Metrics Advisor",
    description:
      "Our Smart Advisor analyzes your metrics locally and generates personalized recommendations — \"Switch to Claude Haiku for simple tasks and save $800/mo\" — not generic advice, your advice.",
    highlight: "Personalized optimization recommendations",
    accent: "from-violet-500/20 to-indigo-500/10",
    border: "hover:border-violet-500/40",
    tag: "AI Insights",
    tagColor: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  },
  {
    icon: "⚡",
    title: "Instant Tokenization",
    description:
      "Client-side tiktoken counts your exact tokens using the same algorithm as OpenAI — before you even hit the API. Catch oversize prompts before they cost you.",
    highlight: "Zero latency, zero server calls",
    accent: "from-cyan-500/20 to-blue-500/10",
    border: "hover:border-cyan-500/40",
    tag: "Performance",
    tagColor: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  },
  {
    icon: "📊",
    title: "Visual Benchmarks",
    description:
      "Interactive bar and scatter charts let you instantly spot which model sits at the sweet spot of price vs performance. Filter, zoom, compare — all live in the browser.",
    highlight: "Side-by-side visual comparison",
    accent: "from-blue-500/20 to-indigo-500/10",
    border: "hover:border-blue-500/40",
    tag: "Visualization",
    tagColor: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  },
  {
    icon: "📄",
    title: "Downloadable PDF Reports",
    description:
      "Generate a clean, formatted report with your comparison results, relatable facts, and AI recommendations. Share it with your team, your manager, or your investors.",
    highlight: "One-click export, no watermarks",
    accent: "from-pink-500/20 to-rose-500/10",
    border: "hover:border-pink-500/40",
    tag: "Reports",
    tagColor: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  },
];

function FeatureShowcaseSection() {
  return (
    <section id="features" className="py-24 px-4 relative">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full bg-indigo-900/10 blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 scroll-reveal">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs text-cyan-300 font-medium mb-4">
            ✨ Everything you need
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Built for teams who care about
            <br />
            <span className="gradient-text-hero">precision and cost</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Six powerful tools in one dashboard — no subscriptions, no logins, no tracking. Just data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              className={`scroll-reveal glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${feat.border} hover:scale-[1.02] cursor-default`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              {/* Card background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feat.accent} pointer-events-none`} />

              <div className="relative z-10">
                {/* Icon + tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{feat.icon}</span>
                  <Badge variant="outline" className={`text-xs ${feat.tagColor}`}>
                    {feat.tag}
                  </Badge>
                </div>

                {/* Title + desc */}
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">{feat.description}</p>

                {/* Highlight */}
                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="text-emerald-400">✓</span>
                  {feat.highlight}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Live Stats Section
───────────────────────────────────────────────────────────────────────────── */
const STATS = [
  { value: MODELS.length, suffix: "+", label: "LLM models benchmarked", icon: "🤖" },
  { value: 6, suffix: "", label: "environmental metrics tracked", icon: "🌍" },
  { value: 100, suffix: "%", label: "client-side processing", icon: "🛡️" },
  { value: 0, suffix: "$", label: "cost to use · always free", icon: "💸", prefix: true },
];

function StatCard({ stat, started }: { stat: (typeof STATS)[0]; started: boolean }) {
  const count = useCounter(stat.value, 1600, started);
  return (
    <div className="text-center px-4">
      <div className="text-4xl mb-2">{stat.icon}</div>
      <div className="text-4xl sm:text-5xl font-black text-white mb-1 tabular-nums">
        {stat.prefix ? stat.suffix : ""}
        {count}
        {!stat.prefix ? stat.suffix : ""}
      </div>
      <div className="text-slate-400 text-sm">{stat.label}</div>
    </div>
  );
}

function LiveStatsSection() {
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.4 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card animate-pulse-glow rounded-3xl py-12 px-6 relative overflow-hidden">
          {/* Background shimmer */}
          <div className="absolute inset-0 animate-shimmer pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-transparent to-violet-900/20 pointer-events-none" />

          <div className="relative z-10">
            <div className="text-center mb-10 scroll-reveal">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                By the numbers
              </h2>
              <p className="text-slate-400 text-sm">What EcoMetrics.ai brings to your workflow</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-slate-800/50">
              {STATS.map((stat) => (
                <StatCard key={stat.label} stat={stat} started={started} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Reports & Settings tabs (unchanged)
───────────────────────────────────────────────────────────────────────────── */
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
          Calculations and report generation are executed completely inside your browser using local
          resources. We never transfer your prompt text to external servers, securing your data privacy.
        </p>
      </CardContent>
    </Card>
  );
}

function SettingsTab() {
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
          <CardTitle className="text-base font-semibold text-white">Local Intelligence & Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-300">
          <p className="text-slate-400 text-xs">
            TokenMetrics is now **100% LLM-free and local**. Optimization recommendations, relatable facts, and cost-benefit trade-offs are computed directly inside your browser.
          </p>
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-4 py-3 flex items-start gap-3">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="font-bold text-slate-200 text-xs uppercase tracking-wider">Privacy Guaranteed</div>
              <div className="text-[11px] text-slate-400 leading-normal mt-0.5">
                No prompts, credentials, or API keys are ever transmitted to Google or any other third-party servers. All benchmarking is executed via local cryptography and static heuristics.
              </div>
            </div>
          </div>
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

/* ─────────────────────────────────────────────────────────────────────────────
   Enhanced Footer
───────────────────────────────────────────────────────────────────────────── */
function EnhancedFooter() {
  return (
    <footer className="border-t border-slate-800/60 mt-8 px-4 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-9 w-9 object-cover rounded-lg border border-slate-800 shadow"
              />
              <div className="text-base font-bold text-white">TokenMetrics<span className="text-indigo-400">.ai</span></div>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              The most comprehensive LLM cost, performance, and environmental impact calculator. Free forever. Private by design.
            </p>
            <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs">
              🛡️ Privacy-first · No tracking
            </Badge>
          </div>

          {/* Links */}
          <div>
            <div className="text-sm font-semibold text-slate-300 mb-4">Navigate</div>
            <ul className="space-y-2 text-sm text-slate-500">
              {[
                { label: "How it works", href: "#how-it-works" },
                { label: "Features", href: "#features" },
                { label: "Calculator", href: "#calculator" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className="hover:text-slate-200 transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Details */}
          <div>
            <div className="text-sm font-semibold text-slate-300 mb-4">Technical details</div>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Client-side tiktoken tokenization</li>
              <li>Smart Local Metrics Advisor</li>
              <li>Real-time environmental metrics</li>
              <li>PDF export via browser engine</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} EcoMetrics.ai · Built by{" "}
            <span className="text-slate-400 font-semibold">shabaresh</span> · Open-source benchmarking
          </p>
          <p className="text-xs text-slate-600">
            All processing client-side · No prompt data stored · No analytics
          </p>
        </div>
      </div>
    </footer>
  );
}
