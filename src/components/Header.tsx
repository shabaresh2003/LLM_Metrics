import { useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Leaf } from "lucide-react";
import { MODELS } from "@/lib/metrics";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-800/80 bg-slate-950/90 backdrop-blur shadow-lg shadow-slate-950/50"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="bg-emerald-500/20 p-1.5 rounded-lg border border-emerald-500/30">
            <Leaf className="h-6 w-6 text-emerald-400" />
          </div>
          <Link to="/" className="flex flex-col">
            <div className="text-base font-bold tracking-tight text-white">
              EcoMetrics<span className="text-emerald-400">.ai</span>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              LLM & Personal Carbon Tracker
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <Link to="/" hash="how-it-works" className="hover:text-white transition-colors">How it works</Link>
          <Link to="/" hash="features" className="hover:text-white transition-colors">Features</Link>
          <Link to="/" hash="calculator" className="hover:text-white transition-colors">LLM Calculator</Link>
          <Link to="/carbon-tracker" className="hover:text-emerald-400 text-emerald-500/80 transition-colors font-medium">🌍 Carbon Tracker</Link>
        </nav>

        {/* Right badges */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex border-emerald-500/30 text-emerald-400 font-medium text-xs">
            🛡️ Privacy-first
          </Badge>
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 font-medium text-xs">
            v2.0 · {MODELS.length} models
          </Badge>
        </div>
      </div>
    </header>
  );
}
