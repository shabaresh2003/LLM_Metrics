import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Plane, Zap, Utensils, ShoppingCart, Leaf, ArrowRight, ArrowLeft, CheckCircle2, Award, Home, LineChart as LineChartIcon } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line } from "recharts";
import { calculateCarbon, saveToHistory, loadHistory, CarbonInputs, CarbonResult, HistoryEntry, DietType } from "@/lib/carbon-tracker";
import { generatePersonalizedActions } from "@/lib/gemini";

export const Route = createFileRoute("/carbon-tracker")({
  component: CarbonTrackerPage,
});

const STEPS = ["Transport", "Energy", "Diet", "Shopping"];

function CarbonTrackerPage() {
  const [step, setStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  const [inputs, setInputs] = useState<CarbonInputs>({
    transport: { carMilesPerWeek: 100, flightsPerYear: 1 },
    energy: { electricityKwhPerMonth: 250, peopleInHousehold: 2 },
    diet: { dietType: "meat_medium" },
    shopping: { shoppingSpendPerMonth: 25000 }
  });

  const [result, setResult] = useState<CarbonResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      const res = calculateCarbon(inputs);
      setResult(res);
      saveToHistory(inputs, res.totalKg);
      setHistory(loadHistory());
      setIsComplete(true);
      setIsGenerating(true);
      
      try {
        const dynamicActions = await generatePersonalizedActions({ data: { inputs, breakdown: res.breakdown, totalKg: res.totalKg } });
        setResult(prev => prev ? { ...prev, actions: dynamicActions } : null);
      } catch (error) {
        console.error(error);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const resetWizard = () => {
    setIsComplete(false);
    setStep(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs text-emerald-400 font-medium mb-4">
            <Leaf className="w-4 h-4" /> Personal Carbon Tracker
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
            Measure your <span className="text-emerald-400">environmental impact</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Discover your CO₂e footprint, see how you compare to global targets, and get personalized, actionable steps to reduce your impact.
          </p>
        </div>

        {!isComplete ? (
          <div className="max-w-2xl mx-auto">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
                {STEPS.map((s, i) => (
                  <span key={s} className={i <= step ? "text-emerald-400" : ""}>{s}</span>
                ))}
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-2 bg-slate-800 [&>div]:bg-emerald-500" />
            </div>

            {/* Wizard Cards */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  {step === 0 && <Car className="w-8 h-8 text-emerald-400" />}
                  {step === 1 && <Zap className="w-8 h-8 text-yellow-400" />}
                  {step === 2 && <Utensils className="w-8 h-8 text-orange-400" />}
                  {step === 3 && <ShoppingCart className="w-8 h-8 text-indigo-400" />}
                  <CardTitle className="text-2xl text-white">{STEPS[step]}</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  {step === 0 && "How do you usually get around?"}
                  {step === 1 && "Tell us about your home energy usage."}
                  {step === 2 && "What does your typical diet look like?"}
                  {step === 3 && "Estimate your monthly shopping habits (excluding groceries)."}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Step 0: Transport */}
                {step === 0 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label className="text-slate-200 text-base">Car travel (miles/week)</Label>
                        <span className="text-emerald-400 font-bold">{inputs.transport.carMilesPerWeek} mi</span>
                      </div>
                      <Slider
                        value={[inputs.transport.carMilesPerWeek]}
                        max={500}
                        step={10}
                        onValueChange={(v) => setInputs({ ...inputs, transport: { ...inputs.transport, carMilesPerWeek: v[0] } })}
                        className="[&>span]:bg-emerald-500"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label className="text-slate-200 text-base">Flights per year (round trips)</Label>
                        <span className="text-emerald-400 font-bold">{inputs.transport.flightsPerYear} flights</span>
                      </div>
                      <Slider
                        value={[inputs.transport.flightsPerYear]}
                        max={10}
                        step={1}
                        onValueChange={(v) => setInputs({ ...inputs, transport: { ...inputs.transport, flightsPerYear: v[0] } })}
                        className="[&>span]:bg-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {/* Step 1: Energy */}
                {step === 1 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label className="text-slate-200 text-base">Electricity (kWh/month)</Label>
                        <span className="text-yellow-400 font-bold">{inputs.energy.electricityKwhPerMonth} kWh</span>
                      </div>
                      <Slider
                        value={[inputs.energy.electricityKwhPerMonth]}
                        max={1000}
                        step={50}
                        onValueChange={(v) => setInputs({ ...inputs, energy: { ...inputs.energy, electricityKwhPerMonth: v[0] } })}
                        className="[&>span]:bg-yellow-500"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label className="text-slate-200 text-base">People in household</Label>
                        <span className="text-yellow-400 font-bold">{inputs.energy.peopleInHousehold}</span>
                      </div>
                      <Slider
                        value={[inputs.energy.peopleInHousehold]}
                        min={1}
                        max={8}
                        step={1}
                        onValueChange={(v) => setInputs({ ...inputs, energy: { ...inputs.energy, peopleInHousehold: v[0] } })}
                        className="[&>span]:bg-yellow-500"
                      />
                      <p className="text-xs text-slate-500">Your energy footprint is divided by the number of people sharing the home.</p>
                    </div>
                  </div>
                )}

                {/* Step 2: Diet */}
                {step === 2 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-3">
                      <Label className="text-slate-200 text-base">Dietary Preference</Label>
                      <Select 
                        value={inputs.diet.dietType} 
                        onValueChange={(v: DietType) => setInputs({ ...inputs, diet: { dietType: v } })}
                      >
                        <SelectTrigger className="w-full bg-slate-950 border-slate-700 text-white h-12">
                          <SelectValue placeholder="Select a diet" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          <SelectItem value="meat_heavy">Meat heavy (2+ portions a day)</SelectItem>
                          <SelectItem value="meat_medium">Meat medium (1 portion a day)</SelectItem>
                          <SelectItem value="meat_low">Meat low (Less than 1 portion a day)</SelectItem>
                          <SelectItem value="pescatarian">Pescatarian (Fish but no meat)</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian (Dairy/eggs but no meat/fish)</SelectItem>
                          <SelectItem value="vegan">Vegan (No animal products)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Step 3: Shopping */}
                {step === 3 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label className="text-slate-200 text-base">Monthly spend on goods/services (₹)</Label>
                        <span className="text-indigo-400 font-bold">₹{inputs.shopping.shoppingSpendPerMonth}</span>
                      </div>
                      <Input 
                        type="number" 
                        className="bg-slate-950 border-slate-700 text-white text-lg h-12"
                        value={inputs.shopping.shoppingSpendPerMonth}
                        onChange={(e) => setInputs({ ...inputs, shopping: { shoppingSpendPerMonth: Number(e.target.value) } })}
                      />
                      <p className="text-xs text-slate-500">Includes clothing, electronics, subscriptions, etc.</p>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between border-t border-slate-800 pt-6">
                <Button 
                  variant="outline" 
                  onClick={handleBack} 
                  disabled={step === 0}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                
                <Button 
                  onClick={handleNext} 
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {step === STEPS.length - 1 ? (
                    <>Calculate Results <CheckCircle2 className="w-4 h-4 ml-2" /></>
                  ) : (
                    <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : result && (
          <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
            
            {/* Results Top Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score Card */}
              <Card className="col-span-1 bg-slate-900 border-slate-800 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Award className="w-32 h-32 text-emerald-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-slate-400 font-medium mb-2 uppercase tracking-widest text-sm">Your Grade</h3>
                  <div className="text-7xl font-black text-white mb-4 drop-shadow-lg">
                    {result.grade}
                  </div>
                  <div className="text-4xl font-bold text-emerald-400 tabular-nums">
                    {result.totalKg.toLocaleString()} <span className="text-lg text-slate-400 font-normal">kg CO₂e</span>
                  </div>
                  <p className="mt-4 text-sm text-slate-400">Estimated annual footprint</p>
                </div>
              </Card>

              {/* Benchmark Comparison */}
              <Card className="col-span-1 lg:col-span-2 bg-slate-900 border-slate-800 p-6 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5 text-indigo-400" /> How you compare
                </h3>
                
                <div className="space-y-8">
                  {/* You */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-emerald-400">You</span>
                      <span className="font-bold text-white">{result.totalKg.toLocaleString()} kg</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3">
                      <div 
                        className="bg-emerald-500 h-3 rounded-full" 
                        style={{ width: `${Math.min(100, (result.totalKg / 10000) * 100)}%` }} 
                      />
                    </div>
                  </div>

                  {/* National Average */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-blue-400">Indian National Average</span>
                      <span className="text-slate-300">1,472 kg</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3 relative">
                      <div className="bg-blue-500/50 h-3 rounded-full" style={{ width: '14.72%' }} />
                      {result.totalKg <= 1472 && (
                        <Badge className="absolute -top-6 right-0 bg-emerald-500/20 text-emerald-400 text-[10px] border-emerald-500/30">Below Average!</Badge>
                      )}
                    </div>
                  </div>

                  {/* Affluent Average */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-orange-400">Affluent Indian Average</span>
                      <span className="text-slate-300">4,768 kg</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-3">
                      <div className="bg-orange-500/50 h-3 rounded-full" style={{ width: '47.68%' }} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Category Breakdown & Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800 p-6">
                <h3 className="text-lg font-bold text-white mb-6">Footprint Breakdown</h3>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: "Transport", value: result.breakdown.transport, fill: "#10b981" },
                        { name: "Energy", value: result.breakdown.energy, fill: "#facc15" },
                        { name: "Diet", value: result.breakdown.diet, fill: "#fb923c" },
                        { name: "Shopping", value: result.breakdown.shopping, fill: "#818cf8" },
                      ]}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" width={80} />
                      <RechartsTooltip 
                        cursor={{fill: '#1e293b'}} 
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff'}} 
                        formatter={(val: number) => [`${val} kg CO₂e`, 'Emissions']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {history.length > 1 && (
                <Card className="bg-slate-900 border-slate-800 p-6">
                  <h3 className="text-lg font-bold text-white mb-6">Your History Trend</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={history.map(h => ({
                          date: new Date(h.date).toLocaleDateString(),
                          total: h.totalKg
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} />
                        <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
                        <RechartsTooltip 
                          contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff'}} 
                          formatter={(val: number) => [`${val} kg`, 'Total']}
                        />
                        <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>

            {/* Personalized Recommendations */}
            <div className="space-y-6 min-h-[200px]">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="text-2xl font-bold text-white">Recommended Actions</h3>
              </div>
              
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 animate-pulse">
                  <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p>Analyzing your footprint with Gemini AI...</p>
                </div>
              ) : result.actions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {result.actions.map((action, i) => (
                    <Card key={action.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start mb-2">
                          <Badge 
                            variant="outline" 
                            className={`
                              ${action.effort === 'easy' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : ''}
                              ${action.effort === 'medium' ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' : ''}
                              ${action.effort === 'hard' ? 'text-orange-400 border-orange-500/30 bg-orange-500/10' : ''}
                            `}
                          >
                            {action.effort.toUpperCase()}
                          </Badge>
                          <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-1 rounded-md">
                            -{action.annualSavingsKg} kg/yr
                          </span>
                        </div>
                        <CardTitle className="text-base text-white leading-tight">{action.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-2 flex-grow">
                        <p className="text-sm text-slate-400 leading-relaxed">{action.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="text-center pt-8 border-t border-slate-800/50">
              <Button onClick={resetWizard} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white px-8">
                Recalculate
              </Button>
            </div>
            
          </div>
        )}
      </div>
    </div>
  );
}
