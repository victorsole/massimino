// Lightweight fitness utilities for client/server usage

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: 'Male' | 'Female'): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'Male' ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multipliers: Record<string, number> = {
    'Sedentary': 1.2,
    'Lightly Active': 1.375,
    'Moderately Active': 1.55,
    'Very Active': 1.725,
    'Extremely Active': 1.9,
  };
  return bmr * (multipliers[activityLevel] ?? 1.2);
}

export function calculateEpley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

export function movingAverage(values: number[], windowSize: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = values.slice(start, i + 1);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    out.push(Number.isFinite(avg) ? avg : 0);
  }
  return out;
}

export function calculateVolume(sets: { reps: number; weight: number }[]): number {
  return sets.reduce((t, s) => t + s.reps * s.weight, 0);
}

