// Classification methods used by GIS thematic maps (ArcGIS, QGIS):
// quantile, equal interval and natural breaks (Jenks). Each returns the upper bound of
// every class, ascending, so a value v falls in the first class whose bound is >= v.

export type ClassMethod = 'quantile' | 'equal' | 'jenks';

export const CLASS_METHODS: { id: ClassMethod; label: string; hint: string }[] = [
  { id: 'jenks', label: 'Natural breaks', hint: 'Groups similar values, splits at the largest gaps' },
  { id: 'quantile', label: 'Quantile', hint: 'Same number of countries in every class' },
  { id: 'equal', label: 'Equal interval', hint: 'Every class covers the same range of values' },
];

function quantileBreaks(sorted: number[], k: number): number[] {
  const out: number[] = [];
  for (let i = 1; i <= k; i++) {
    const idx = Math.min(sorted.length - 1, Math.ceil((i / k) * sorted.length) - 1);
    out.push(sorted[idx]);
  }
  return out;
}

function equalBreaks(sorted: number[], k: number): number[] {
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const step = (max - min) / k;
  return Array.from({ length: k }, (_, i) => (i === k - 1 ? max : min + step * (i + 1)));
}

/** Fisher-Jenks optimal breaks (O(k·n²), fine for a few dozen countries) */
function jenksBreaks(sorted: number[], k: number): number[] {
  const n = sorted.length;
  const lower: number[][] = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(0));
  const variance: number[][] = Array.from({ length: n + 1 }, () => new Array(k + 1).fill(Infinity));
  for (let j = 1; j <= k; j++) {
    lower[1][j] = 1;
    variance[1][j] = 0;
  }
  for (let l = 2; l <= n; l++) {
    let s1 = 0;
    let s2 = 0;
    let w = 0;
    for (let m = 1; m <= l; m++) {
      const i3 = l - m + 1;
      const val = sorted[i3 - 1];
      s2 += val * val;
      s1 += val;
      w += 1;
      const v = s2 - (s1 * s1) / w;
      const i4 = i3 - 1;
      if (i4 !== 0) {
        for (let j = 2; j <= k; j++) {
          if (variance[l][j] >= v + variance[i4][j - 1]) {
            lower[l][j] = i3;
            variance[l][j] = v + variance[i4][j - 1];
          }
        }
      }
    }
    lower[l][1] = 1;
    variance[l][1] = v1(sorted, l);
  }
  const breaks: number[] = new Array(k);
  breaks[k - 1] = sorted[n - 1];
  let idx = n;
  for (let j = k; j >= 2; j--) {
    const id = lower[idx][j] - 1;
    breaks[j - 2] = sorted[id - 1];
    idx = id;
  }
  return breaks;
}

function v1(sorted: number[], l: number): number {
  let s1 = 0;
  let s2 = 0;
  for (let i = 0; i < l; i++) {
    s1 += sorted[i];
    s2 += sorted[i] * sorted[i];
  }
  return s2 - (s1 * s1) / l;
}

/**
 * Upper bounds for up to `k` classes. Fewer classes come back when there are fewer
 * distinct values than classes, so no empty class is ever drawn in the legend.
 */
export function classify(values: number[], method: ClassMethod, k = 5): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const distinct = new Set(sorted).size;
  if (sorted.length === 0) return [];
  const classes = Math.max(1, Math.min(k, distinct));
  if (classes === 1) return [sorted[sorted.length - 1]];
  const raw =
    method === 'quantile' ? quantileBreaks(sorted, classes) : method === 'equal' ? equalBreaks(sorted, classes) : jenksBreaks(sorted, classes);
  // Drop duplicate bounds (quantile on tied values)
  return raw.filter((b, i) => i === 0 || b > raw[i - 1]);
}

export function classOf(value: number, breaks: number[]): number {
  for (let i = 0; i < breaks.length; i++) if (value <= breaks[i]) return i;
  return breaks.length - 1;
}

/** Pick `n` colours spread across a 5-step ramp */
export function rampFor(ramp: readonly string[], n: number): string[] {
  if (n >= ramp.length) return [...ramp];
  if (n === 1) return [ramp[ramp.length - 2]];
  return Array.from({ length: n }, (_, i) => ramp[Math.round((i * (ramp.length - 1)) / (n - 1))]);
}

/** 3x3 bivariate palette (Joshua Stevens, teal by pink). Index = y * 3 + x. */
export const BIVARIATE_PALETTE = [
  '#e8e8e8', '#ace4e4', '#5ac8c8',
  '#dfb0d6', '#a5add3', '#5698b9',
  '#be64ac', '#8c62aa', '#3b4994',
];

export function tertileBreaks(values: number[]): [number, number] {
  const s = [...values].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))];
  return [at(1 / 3), at(2 / 3)];
}

export function tertileOf(v: number, [a, b]: [number, number]): 0 | 1 | 2 {
  return v <= a ? 0 : v <= b ? 1 : 2;
}
