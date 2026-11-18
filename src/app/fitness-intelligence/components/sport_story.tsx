// Sport in Europe: who plays, who works, who wins.
// Server-rendered inline SVG charts built from src/data/fitness/sport_europe.ts.

import { SPORT_EUROPE, SPORT_EUROPE_META, EU_SPORT_EMPLOYMENT_SERIES } from '@/data/fitness/sport_europe';

const TEAL = '#1f8a82';
const PINK = '#b4467f';
const ORANGE = '#c2410c';
const PURPLE = '#6a51a3';
const GRID = '#e7e2d8';

/* ---------- KPI card: Label, Value, Delta, Time frame ---------- */

function Kpi({ label, value, delta, frame, accent }: { label: string; value: string; delta: string; frame: string; accent: string }) {
  return (
    <div className="rounded-card bg-white p-4 shadow-soft sm:p-5">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold tabular-nums sm:text-4xl" style={{ color: accent }}>
        {value}
      </p>
      <p className="mt-1 text-sm text-gray-700">{delta}</p>
      <p className="mt-2 text-xs text-gray-500">{frame}</p>
    </div>
  );
}

function ChartCard({ title, takeaway, source, children }: { title: string; takeaway: string; source: React.ReactNode; children: React.ReactNode }) {
  return (
    <figure className="min-w-0 rounded-card bg-white p-4 shadow-soft sm:p-6">
      <h3 className="font-display text-base font-bold text-brand-primary sm:text-lg">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{takeaway}</p>
      <div className="mt-4">{children}</div>
      <figcaption className="mt-3 text-xs text-gray-500">{source}</figcaption>
    </figure>
  );
}

/* ---------- Chart 1: weekly exercise by gender (dumbbell) ---------- */

function GenderDumbbell() {
  const rows = SPORT_EUROPE.filter((c) => c.participation)
    .map((c) => ({ name: c.name, men: c.participation!.men_pct, women: c.participation!.women_pct, all: c.participation!.regular_pct }))
    .sort((a, b) => b.all - a.all);
  const W = 440;
  const rowH = 20;
  const left = 100;
  const right = 16;
  const top = 26;
  const H = top + rows.length * rowH + 8;
  const max = 80;
  const x = (v: number) => left + (v / max) * (W - left - right);
  const eu = SPORT_EUROPE_META.participation;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby="gd-title gd-desc">
        <title id="gd-title">Share of adults who exercise at least weekly, men and women, by EU country</title>
        <desc id="gd-desc">
          Finland leads at 71 percent with almost no gender gap. Ireland, Poland and Slovakia show gaps of 13 to 15 points. EU average: men{' '}
          {eu.eu27_men_pct} percent, women {eu.eu27_women_pct} percent.
        </desc>
        {[0, 20, 40, 60, 80].map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={top - 6} y2={H - 6} stroke={GRID} />
            <text x={x(t)} y={top - 12} textAnchor="middle" fontSize="10" fill="#6b7280">
              {t}%
            </text>
          </g>
        ))}
        <line x1={x(eu.eu27_regular_pct)} x2={x(eu.eu27_regular_pct)} y1={top - 6} y2={H - 6} stroke="#2b5069" strokeDasharray="3 3" />
        {rows.map((r, i) => {
          const y = top + i * rowH + rowH / 2;
          return (
            <g key={r.name}>
              <text x={left - 8} y={y + 3.5} textAnchor="end" fontSize="11" fill="#374151">
                {r.name}
              </text>
              <line x1={x(Math.min(r.men, r.women))} x2={x(Math.max(r.men, r.women))} y1={y} y2={y} stroke="#cbd5e1" strokeWidth="3" />
              <circle cx={x(r.women)} cy={y} r="4.5" fill={PINK}>
                <title>{`${r.name}, women: ${r.women}%`}</title>
              </circle>
              <rect x={x(r.men) - 4} y={y - 4} width="8" height="8" fill={TEAL}>
                <title>{`${r.name}, men: ${r.men}%`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5" style={{ background: TEAL }} /> Men
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PINK }} /> Women
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block w-4 border-t border-dashed border-brand-primary" /> EU27 average {eu.eu27_regular_pct}%
        </span>
      </div>
    </div>
  );
}

/* ---------- Chart 2: EU sport employment 2011 to 2025 ---------- */

function EmploymentLine() {
  const s = EU_SPORT_EMPLOYMENT_SERIES;
  const W = 440;
  const H = 230;
  const pad = { l: 40, r: 44, t: 16, b: 28 };
  const minY = 1000;
  const maxY = 1900;
  const x = (yr: number) => pad.l + ((yr - s[0].year) / (s[s.length - 1].year - s[0].year)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - minY) / (maxY - minY)) * (H - pad.t - pad.b);
  const path = s.map((d, i) => `${i ? 'L' : 'M'}${x(d.year).toFixed(1)},${y(d.jobs_thousands).toFixed(1)}`).join(' ');
  const area = `${path} L${x(s[s.length - 1].year)},${y(minY)} L${x(s[0].year)},${y(minY)} Z`;
  const first = s[0];
  const last = s[s.length - 1];
  const covid = s.find((d) => d.year === 2020)!;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby="el-title el-desc">
      <title id="el-title">People employed in sport in the EU, 2011 to 2025</title>
      <desc id="el-desc">
        Employment in sport rose from {first.jobs_thousands.toLocaleString('en-GB')} thousand in 2011 to {last.jobs_thousands.toLocaleString('en-GB')}{' '}
        thousand in 2025, from {first.share_pct}% to {last.share_pct}% of all jobs, with a dip in 2020.
      </desc>
      {[1000, 1300, 1600, 1900].map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} />
          <text x={pad.l - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#6b7280">
            {(t / 1000).toFixed(1)}M
          </text>
        </g>
      ))}
      {[2011, 2015, 2020, 2025].map((t) => (
        <text key={t} x={x(t)} y={H - 8} textAnchor="middle" fontSize="10" fill="#6b7280">
          {t}
        </text>
      ))}
      <path d={area} fill={ORANGE} fillOpacity="0.08" />
      <path d={path} fill="none" stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round" />
      {s.map((d) => (
        <circle key={d.year} cx={x(d.year)} cy={y(d.jobs_thousands)} r="2.5" fill={ORANGE}>
          <title>{`${d.year}: ${d.jobs_thousands.toLocaleString('en-GB')}k jobs, ${d.share_pct}% of employment`}</title>
        </circle>
      ))}
      <text x={x(first.year) + 2} y={y(first.jobs_thousands) + 18} fontSize="10.5" fill="#374151">
        {first.share_pct}% of jobs
      </text>
      <text x={x(last.year) + 6} y={y(last.jobs_thousands) + 4} fontSize="10.5" fontWeight="600" fill={ORANGE}>
        {last.share_pct}%
      </text>
      <text x={x(covid.year)} y={y(covid.jobs_thousands) + 16} textAnchor="middle" fontSize="10" fill="#6b7280">
        2020 dip
      </text>
    </svg>
  );
}

/* ---------- Chart 3: Paris 2024 medals per million people ---------- */

function MedalsPerMillion() {
  const rows = SPORT_EUROPE.filter((c) => c.olympics.per_million != null && c.olympics.total > 0)
    .sort((a, b) => b.olympics.per_million! - a.olympics.per_million!)
    .slice(0, 15);
  const euAvg = SPORT_EUROPE_META.olympics.eu27_total / 450.05;
  const W = 440;
  const rowH = 22;
  const left = 104;
  const right = 72;
  const top = 8;
  const H = top + rows.length * rowH + 22;
  const max = Math.ceil(rows[0].olympics.per_million!);
  const x = (v: number) => left + (v / max) * (W - left - right);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-labelledby="mp-title mp-desc">
        <title id="mp-title">Paris 2024 Olympic medals per million inhabitants, top 15 European countries</title>
        <desc id="mp-desc">
          {rows
            .slice(0, 3)
            .map((r) => `${r.name} ${r.olympics.per_million} medals per million`)
            .join(', ')}
          . The EU27 average is {euAvg.toFixed(2)}.
        </desc>
        {rows.map((r, i) => {
          const y = top + i * rowH;
          const o = r.olympics;
          return (
            <g key={r.iso_code}>
              <text x={left - 8} y={y + 14} textAnchor="end" fontSize="11" fill="#374151">
                {r.name}
              </text>
              <rect x={left} y={y + 4} width={Math.max(1, x(o.per_million!) - left)} height={rowH - 8} rx="2" fill={r.eu ? PURPLE : '#a59bc8'} />
              <text x={x(o.per_million!) + 6} y={y + 14} fontSize="10.5" fill="#374151">
                <tspan fontWeight="600">{o.per_million!.toFixed(2)}</tspan>
                <tspan fill="#6b7280">{` (${o.total})`}</tspan>
              </text>
            </g>
          );
        })}
        <line x1={x(euAvg)} x2={x(euAvg)} y1={top} y2={H - 18} stroke="#2b5069" strokeDasharray="3 3" />
        <text x={x(euAvg)} y={H - 6} textAnchor="middle" fontSize="10" fill="#2b5069">
          EU27 {euAvg.toFixed(2)}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: PURPLE }} /> EU member
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: '#a59bc8' }} /> Rest of Europe
        </span>
        <span>Total medals in brackets</span>
      </div>
    </div>
  );
}

/* ---------- Section ---------- */

export function SportStory() {
  const p = SPORT_EUROPE_META.participation;
  const e = SPORT_EUROPE_META.employment;
  const o = SPORT_EUROPE_META.olympics;
  const link = (href: string, text: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">
      {text}
    </a>
  );

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Kpi
          label="Adults who exercise at least weekly"
          value={`${Math.round(p.eu27_regular_pct)}%`}
          delta={`Men ${p.eu27_men_pct}% vs women ${p.eu27_women_pct}%; ${Math.round(p.eu27_never_pct)}% never exercise`}
          frame="EU27 · Eurobarometer 525, spring 2022"
          accent={TEAL}
        />
        <Kpi
          label="People employed in sport"
          value={`${(e.eu27_jobs_thousands / 1000).toFixed(2)}M`}
          delta={`${e.eu27_share_pct}% of all jobs, up from ${e.eu27_share_2011_pct}% in 2011; ${Math.round(e.eu27_youth_share_pct)}% aged 15 to 29`}
          frame="EU27 · Eurostat, 2025"
          accent={ORANGE}
        />
        <Kpi
          label="Olympic medals won by EU countries"
          value={String(o.eu27_total)}
          delta={`Of ${o.europe_total} won by Europe as a whole, more than any other continent`}
          frame="Paris 2024 Olympic Games"
          accent={PURPLE}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          title="Who plays: weekly exercise by gender"
          takeaway="Finland, the Netherlands and Denmark have almost no gender gap. In Ireland, Poland and Slovakia men are 13 to 15 points more likely to exercise weekly. Luxembourg is the one country where women are slightly ahead."
          source={
            <>
              Share of adults who exercise or play sport at least once a week. Source: {link(p.url, 'Special Eurobarometer 525')} (fieldwork April to May
              2022), Volumes A and C, computed from weighted counts.
            </>
          }
        >
          <GenderDumbbell />
        </ChartCard>

        <div className="grid grid-cols-1 gap-6">
          <ChartCard
            title="Who works: sport jobs keep growing"
            takeaway={`The EU sport workforce grew by ${Math.round((e.eu27_jobs_thousands / EU_SPORT_EMPLOYMENT_SERIES[0].jobs_thousands - 1) * 100)}% between 2011 and 2025, faster than employment overall. Among EU members, Sweden has the highest share (1.59%) and Romania the lowest (0.22%).`}
            source={
              <>
                Employed persons in sport (coaches, fitness instructors, sports managers and others). Source: Eurostat {link(e.url, 'sprt_emp_sex')}, updated 25
                July 2026.
              </>
            }
          >
            <EmploymentLine />
          </ChartCard>

          <ChartCard
            title="Who wins: medals for their size"
            takeaway="France won the most EU medals at its home Games (64), but smaller countries win more for their size: Hungary (1.98 per million), the Netherlands, Georgia and Croatia lead per head."
            source={
              <>
                Source: {link(o.url, 'Paris 2024 medal results')} (data.education.gouv.fr), population from Eurostat tps00001 (1 January 2024). Great Britain
                shown as the United Kingdom.
              </>
            }
          >
            <MedalsPerMillion />
          </ChartCard>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Based on the data.europa.eu data story {link(SPORT_EUROPE_META.story_url, '“Sport in Europe: who plays, who works, who wins”')} (
        {SPORT_EUROPE_META.story_date}). Figures recomputed from the source datasets on {SPORT_EUROPE_META.retrieved}, so a few differ by a rounding
        point from the story.
      </p>
    </div>
  );
}
