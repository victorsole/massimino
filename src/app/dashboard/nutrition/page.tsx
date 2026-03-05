'use client';

import { Coffee, UtensilsCrossed, Apple, Cookie } from 'lucide-react';

const meals = [
  {
    name: 'Breakfast',
    description: 'Oatmeal with berries & protein shake',
    time: '7:30 AM',
    calories: 520,
    icon: Coffee,
    colorBg: 'bg-[#E8C547]/15',
    colorText: 'text-[#E8C547]',
  },
  {
    name: 'Lunch',
    description: 'Grilled chicken salad with quinoa',
    time: '12:30 PM',
    calories: 680,
    icon: UtensilsCrossed,
    colorBg: 'bg-[#4ADE80]/15',
    colorText: 'text-[#4ADE80]',
  },
  {
    name: 'Snack',
    description: 'Greek yogurt with almonds & honey',
    time: '3:30 PM',
    calories: 280,
    icon: Apple,
    colorBg: 'bg-[#22D3EE]/15',
    colorText: 'text-[#22D3EE]',
  },
  {
    name: 'Dinner',
    description: 'Salmon with sweet potato & vegetables',
    time: '7:00 PM',
    calories: 720,
    icon: Cookie,
    colorBg: 'bg-[#E855A0]/15',
    colorText: 'text-[#E855A0]',
  },
];

const macros = [
  { label: 'Protein', value: '156g', target: '160g' },
  { label: 'Carbs', value: '220g', target: '250g' },
  { label: 'Fats', value: '68g', target: '70g' },
  { label: 'Fiber', value: '32g', target: '35g' },
  { label: 'Water', value: '2.4L', target: '3.0L' },
];

export default function NutritionPage() {
  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Nutrition</h2>
        <p className="text-sm text-gray-500 mt-1">Track your daily meals and macros.</p>
      </div>

      {/* Preview data banner */}
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm">&#9432;</span>
        </div>
        <div>
          <p className="text-sm font-medium text-amber-800">Preview mode</p>
          <p className="text-xs text-amber-600">Showing example data. Full meal logging and macro tracking are coming soon.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Meals */}
        <div className="flex flex-col gap-3">
          <h3 className="text-base font-semibold text-gray-900">Today&apos;s Meals</h3>
          {meals.map((m, i) => {
            const Icon = m.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-100"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.colorBg}`}>
                  <Icon className={`w-6 h-6 ${m.colorText}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.description} &middot; {m.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{m.calories}</p>
                  <p className="text-xs text-gray-400">kcal</p>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between p-4 bg-[#2b5069] rounded-xl text-white">
            <span className="font-medium">Total Calories</span>
            <span className="text-xl font-bold">{totalCalories} <span className="text-sm font-normal opacity-70">kcal</span></span>
          </div>
        </div>

        {/* Macro summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Macro Breakdown</h3>
          <div className="divide-y divide-gray-100">
            {macros.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-600">{m.label}</span>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">{m.value}</span>
                  <span className="text-xs text-gray-400 ml-1">/ {m.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
