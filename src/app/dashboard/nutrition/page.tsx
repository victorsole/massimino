'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Coffee,
  UtensilsCrossed,
  Apple,
  Cookie,
  Plus,
  Trash2,
  Droplets,
  Target,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Flame,
  X,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
interface NutritionLog {
  id: string;
  mealType: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number | null;
  notes?: string | null;
  createdAt: string;
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface ActivePlan {
  id: string;
  name: string;
  description?: string;
  targetCalories?: number | null;
  targetProtein?: number | null;
  targetCarbs?: number | null;
  targetFat?: number | null;
  targetFiber?: number | null;
}

interface NutritionData {
  date: string;
  logs: NutritionLog[];
  groupedLogs: Record<string, NutritionLog[]>;
  totals: NutritionTotals;
  activePlan: ActivePlan | null;
}

// ── Constants ──────────────────────────────────────────────────────────────
const MEAL_CONFIG = {
  breakfast: {
    label: 'Breakfast',
    icon: Coffee,
    colorBg: 'bg-amber-500/15',
    colorText: 'text-amber-500',
    borderColor: 'border-amber-200',
  },
  lunch: {
    label: 'Lunch',
    icon: UtensilsCrossed,
    colorBg: 'bg-emerald-500/15',
    colorText: 'text-emerald-500',
    borderColor: 'border-emerald-200',
  },
  snack: {
    label: 'Snack',
    icon: Apple,
    colorBg: 'bg-cyan-500/15',
    colorText: 'text-cyan-500',
    borderColor: 'border-cyan-200',
  },
  dinner: {
    label: 'Dinner',
    icon: Cookie,
    colorBg: 'bg-pink-500/15',
    colorText: 'text-pink-500',
    borderColor: 'border-pink-200',
  },
} as const;

// NASM CNC-based macronutrient guidelines
const NASM_GUIDELINES = {
  protein: {
    title: 'Protein',
    rda: '0.8 g/kg/day (minimum)',
    active: '1.2–1.6 g/kg/day',
    athlete: '1.6–2.2 g/kg/day',
    timing: '0.25–0.3 g/kg post-workout (20–30g typical)',
    note: 'Essential amino acids (EAAs) must come from diet. Leucine is the primary trigger for muscle protein synthesis.',
  },
  carbs: {
    title: 'Carbohydrates',
    general: '45–65% of total energy',
    endurance: '8–12 g/kg/day',
    strength: '5–7 g/kg/day',
    timing: '1–4 g/kg, 2–4 hours pre-exercise; 1–1.2 g/kg/hr for 4–6 hours post-exercise',
    note: 'Glucose is the brain\'s preferred fuel source. Glycogen stores fuel up to 120 min of continuous exercise.',
  },
  fats: {
    title: 'Fats',
    general: '20–35% of total energy',
    minimum: 'Not below 20% for hormone production',
    note: 'Essential for absorption of fat-soluble vitamins A, D, E, K. Fatty acids are the most abundant endogenous energy source.',
  },
  hydration: {
    title: 'Hydration',
    preExercise: '~600 mL (20 oz), 4 hours before activity',
    during: '0.4–0.8 L/hour depending on sweat rate',
    post: '1.25–1.5 L per kg of body weight lost',
    daily: 'Aim for pale yellow urine; general target 2.7–3.7 L/day',
  },
};

const NUTRIENT_TIMING = [
  {
    phase: 'Pre-Exercise (3–4 hrs)',
    recommendations: 'High-quality carbs, lean protein, low fiber/fat. Example: oatmeal with eggs, or toast with turkey.',
  },
  {
    phase: 'Pre-Exercise Snack (30–60 min)',
    recommendations: 'Quick carbs + moderate protein. Example: banana with nut butter, yogurt, or chocolate milk.',
  },
  {
    phase: 'During Exercise (>60 min)',
    recommendations: '30–60g carbs/hour via sports drinks, gels, or fruit. Replace electrolytes (sodium, potassium).',
  },
  {
    phase: 'Post-Exercise (within 2 hrs)',
    recommendations: 'Carbs: 1–1.2 g/kg/hr for 4–6 hrs. Protein: 0.25–0.3 g/kg. Rehydrate 1.25–1.5 L per kg lost.',
  },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function NutritionPage() {
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [addingMeal, setAddingMeal] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showTiming, setShowTiming] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    foodName: '',
    quantity: 1,
    unit: 'serving',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    notes: '',
  });

  const fetchNutrition = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/nutrition?date=${selectedDate}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch nutrition data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchNutrition();
  }, [fetchNutrition]);

  const resetForm = () => {
    setFormData({
      foodName: '',
      quantity: 1,
      unit: 'serving',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      notes: '',
    });
  };

  const handleAddFood = async (mealType: string) => {
    if (!formData.foodName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          mealType,
          ...formData,
        }),
      });
      if (res.ok) {
        resetForm();
        setAddingMeal(null);
        await fetchNutrition();
      }
    } catch (err) {
      console.error('Failed to add food:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      const res = await fetch(`/api/nutrition?id=${logId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchNutrition();
      }
    } catch (err) {
      console.error('Failed to delete log:', err);
    }
  };

  const totals = data?.totals || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const plan = data?.activePlan;

  // Progress bar helper
  const progressPct = (current: number, target: number | null | undefined) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const progressColor = (pct: number) => {
    if (pct >= 90 && pct <= 110) return 'bg-emerald-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-[#2b5069]';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 font-display">Nutrition</h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your daily meals and macros — powered by NASM CNC guidelines.
          </p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20 w-fit"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-[#2b5069]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* ── Left Column: Meals ── */}
          <div className="flex flex-col gap-4">
            {/* Daily Summary Bar */}
            <div className="flex items-center justify-between p-4 bg-[#2b5069] rounded-xl text-white">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <span className="font-medium">Daily Total</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span><strong>{Math.round(totals.calories)}</strong> kcal</span>
                <span className="hidden sm:inline opacity-70">|</span>
                <span className="hidden sm:inline">P: {Math.round(totals.protein)}g</span>
                <span className="hidden sm:inline">C: {Math.round(totals.carbs)}g</span>
                <span className="hidden sm:inline">F: {Math.round(totals.fat)}g</span>
              </div>
            </div>

            {/* Meal Sections */}
            {(Object.keys(MEAL_CONFIG) as Array<keyof typeof MEAL_CONFIG>).map((mealKey) => {
              const config = MEAL_CONFIG[mealKey];
              const Icon = config.icon;
              const mealLogs = data?.groupedLogs?.[mealKey] || [];
              const mealCalories = mealLogs.reduce((s, l) => s + l.calories, 0);

              return (
                <div key={mealKey} className={`bg-white rounded-xl shadow-sm border ${config.borderColor}`}>
                  {/* Meal Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.colorBg}`}>
                        <Icon className={`w-5 h-5 ${config.colorText}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{config.label}</h3>
                        <p className="text-xs text-gray-400">
                          {mealLogs.length} item{mealLogs.length !== 1 ? 's' : ''} &middot; {mealCalories} kcal
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAddingMeal(addingMeal === mealKey ? null : mealKey);
                        resetForm();
                      }}
                      className="p-2 rounded-lg text-[#2b5069] hover:bg-[#2b5069]/10 transition-colors"
                      aria-label={`Add ${config.label}`}
                    >
                      {addingMeal === mealKey ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Food Items */}
                  {mealLogs.length > 0 && (
                    <div className="divide-y divide-gray-50">
                      {mealLogs.map((log) => (
                        <div key={log.id} className="flex items-center gap-3 px-4 py-3 group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{log.foodName}</p>
                            <p className="text-xs text-gray-400">
                              {log.quantity} {log.unit}
                              {log.notes ? ` — ${log.notes}` : ''}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900">{log.calories} kcal</p>
                            <p className="text-xs text-gray-400">
                              P:{Math.round(log.protein)}g C:{Math.round(log.carbs)}g F:{Math.round(log.fat)}g
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 rounded text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {mealLogs.length === 0 && addingMeal !== mealKey && (
                    <button
                      onClick={() => {
                        setAddingMeal(mealKey);
                        resetForm();
                      }}
                      className="w-full p-4 text-sm text-gray-400 hover:text-[#2b5069] hover:bg-gray-50 transition-colors text-center"
                    >
                      + Add {config.label.toLowerCase()}
                    </button>
                  )}

                  {/* Add Food Form */}
                  {addingMeal === mealKey && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Food name (e.g., Grilled chicken breast)"
                            value={formData.foodName}
                            onChange={(e) => setFormData({ ...formData, foodName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={formData.quantity || ''}
                            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20"
                            min={0}
                            step={0.5}
                          />
                          <select
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20 bg-white"
                          >
                            <option value="serving">serving</option>
                            <option value="g">g</option>
                            <option value="oz">oz</option>
                            <option value="cup">cup</option>
                            <option value="tbsp">tbsp</option>
                            <option value="piece">piece</option>
                            <option value="ml">mL</option>
                            <option value="scoop">scoop</option>
                          </select>
                        </div>
                        <input
                          type="number"
                          placeholder="Calories"
                          value={formData.calories || ''}
                          onChange={(e) => setFormData({ ...formData, calories: parseFloat(e.target.value) || 0 })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20"
                          min={0}
                        />
                        <input
                          type="number"
                          placeholder="Protein (g)"
                          value={formData.protein || ''}
                          onChange={(e) => setFormData({ ...formData, protein: parseFloat(e.target.value) || 0 })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20"
                          min={0}
                        />
                        <input
                          type="number"
                          placeholder="Carbs (g)"
                          value={formData.carbs || ''}
                          onChange={(e) => setFormData({ ...formData, carbs: parseFloat(e.target.value) || 0 })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20"
                          min={0}
                        />
                        <input
                          type="number"
                          placeholder="Fat (g)"
                          value={formData.fat || ''}
                          onChange={(e) => setFormData({ ...formData, fat: parseFloat(e.target.value) || 0 })}
                          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20"
                          min={0}
                        />
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Notes (optional)"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2b5069]/20"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => { setAddingMeal(null); resetForm(); }}
                          className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAddFood(mealKey)}
                          disabled={!formData.foodName.trim() || submitting}
                          className="px-4 py-2 text-sm font-medium text-white bg-[#2b5069] rounded-lg hover:bg-[#1e3a4d] disabled:opacity-50 transition-colors"
                        >
                          {submitting ? 'Adding...' : 'Add Food'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Right Column: Sidebar ── */}
          <div className="flex flex-col gap-4">
            {/* Macro Targets */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-[#2b5069]" />
                <h3 className="text-base font-semibold text-gray-900">
                  {plan ? 'Your Targets' : 'Daily Macros'}
                </h3>
              </div>

              {plan && (
                <p className="text-xs text-gray-400 mb-3 -mt-2">
                  Plan: {plan.name}
                </p>
              )}

              <div className="space-y-4">
                {/* Calories */}
                <MacroRow
                  label="Calories"
                  value={Math.round(totals.calories)}
                  target={plan?.targetCalories}
                  unit="kcal"
                  progressPct={progressPct}
                  progressColor={progressColor}
                />
                <MacroRow
                  label="Protein"
                  value={Math.round(totals.protein)}
                  target={plan?.targetProtein}
                  unit="g"
                  progressPct={progressPct}
                  progressColor={progressColor}
                />
                <MacroRow
                  label="Carbs"
                  value={Math.round(totals.carbs)}
                  target={plan?.targetCarbs}
                  unit="g"
                  progressPct={progressPct}
                  progressColor={progressColor}
                />
                <MacroRow
                  label="Fat"
                  value={Math.round(totals.fat)}
                  target={plan?.targetFat}
                  unit="g"
                  progressPct={progressPct}
                  progressColor={progressColor}
                />
                <MacroRow
                  label="Fiber"
                  value={Math.round(totals.fiber)}
                  target={plan?.targetFiber}
                  unit="g"
                  progressPct={progressPct}
                  progressColor={progressColor}
                />
              </div>

              {!plan && (
                <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
                  No active nutrition plan. Set targets via your trainer or create a plan to track against goals.
                </p>
              )}
            </div>

            {/* Hydration Quick Ref */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Droplets className="w-4 h-4 text-cyan-500" />
                <h3 className="text-sm font-semibold text-gray-900">Hydration (NASM)</h3>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <p><span className="font-medium text-gray-800">Pre-exercise:</span> {NASM_GUIDELINES.hydration.preExercise}</p>
                <p><span className="font-medium text-gray-800">During:</span> {NASM_GUIDELINES.hydration.during}</p>
                <p><span className="font-medium text-gray-800">Post:</span> {NASM_GUIDELINES.hydration.post}</p>
                <p><span className="font-medium text-gray-800">Daily:</span> {NASM_GUIDELINES.hydration.daily}</p>
              </div>
            </div>

            {/* NASM Guidelines Accordion */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setShowGuidelines(!showGuidelines)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#2b5069]" />
                  <h3 className="text-sm font-semibold text-gray-900">NASM Macro Guidelines</h3>
                </div>
                {showGuidelines ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {showGuidelines && (
                <div className="px-5 pb-5 space-y-4">
                  {Object.values(NASM_GUIDELINES).filter(g => g.title !== 'Hydration').map((g) => (
                    <div key={g.title} className="border-t border-gray-100 pt-3">
                      <h4 className="text-sm font-semibold text-[#2b5069] mb-1">{g.title}</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {Object.entries(g)
                          .filter(([k]) => k !== 'title')
                          .map(([key, val]) => (
                            <p key={key}>
                              <span className="font-medium text-gray-700 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>{' '}
                              {val}
                            </p>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nutrient Timing Accordion */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setShowTiming(!showTiming)}
                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-semibold text-gray-900">Nutrient Timing (NASM)</h3>
                </div>
                {showTiming ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {showTiming && (
                <div className="px-5 pb-5 space-y-3">
                  {NUTRIENT_TIMING.map((t, i) => (
                    <div key={i} className="border-t border-gray-100 pt-3">
                      <h4 className="text-xs font-semibold text-[#2b5069] mb-1">{t.phase}</h4>
                      <p className="text-xs text-gray-600">{t.recommendations}</p>
                    </div>
                  ))}
                  <p className="text-[10px] text-gray-400 pt-2 border-t border-gray-100">
                    Source: NASM Certified Nutrition Coach (CNC) — Chapter 11: Nutrient Timing
                  </p>
                </div>
              )}
            </div>

            {/* Energy Stores Reference */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Energy Stores in the Body</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-500">Source</th>
                      <th className="text-left py-2 font-medium text-gray-500">Site</th>
                      <th className="text-right py-2 font-medium text-gray-500">kcal</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    <tr className="border-b border-gray-50">
                      <td className="py-1.5">ATP-PC</td><td className="py-1.5">Various tissues</td><td className="text-right py-1.5">5</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-1.5">Carbs</td><td className="py-1.5">Blood glucose</td><td className="text-right py-1.5">80</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-1.5"></td><td className="py-1.5">Liver glycogen</td><td className="text-right py-1.5">400</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-1.5"></td><td className="py-1.5">Muscle glycogen</td><td className="text-right py-1.5">1,500</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-1.5">Fat</td><td className="py-1.5">Muscle triglycerides</td><td className="text-right py-1.5">2,500</td>
                    </tr>
                    <tr className="border-b border-gray-50">
                      <td className="py-1.5"></td><td className="py-1.5">Adipose tissue</td><td className="text-right py-1.5">80,000+</td>
                    </tr>
                    <tr>
                      <td className="py-1.5">Protein</td><td className="py-1.5">Muscle protein</td><td className="text-right py-1.5">30,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Source: NASM CNC — Estimated Energy Stores in Humans
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Subcomponents ──────────────────────────────────────────────────────────
function MacroRow({
  label,
  value,
  target,
  unit,
  progressPct,
  progressColor,
}: {
  label: string;
  value: number;
  target?: number | null;
  unit: string;
  progressPct: (current: number, target: number | null | undefined) => number;
  progressColor: (pct: number) => string;
}) {
  const pct = progressPct(value, target);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-900">
            {value} {unit}
          </span>
          {target && (
            <span className="text-xs text-gray-400 ml-1">/ {target} {unit}</span>
          )}
        </div>
      </div>
      {target && (
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor(pct)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
