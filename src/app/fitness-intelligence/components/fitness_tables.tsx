'use client';

import { DataTable, type DataColumn } from './data_table';
import { formatNumber, formatRevenue } from '@/data/fitness/industry_2024';
import { EUROSTAT_ACTIVITY_META, type ActivityDatum } from '@/data/fitness/eurostat_activity';
import type {
  CountryFitnessData,
  GymChainData,
  SupplementCompanyData,
  FitnessInfluencerData,
  HashtagData,
} from '@/types/fitness_data';

function formatMarketSize(eur: number): string {
  if (eur >= 1_000_000_000) return `${(eur / 1_000_000_000).toFixed(1)}B`;
  return `${(eur / 1_000_000).toFixed(0)}M`;
}

const rankCell = (_: unknown, idx: number) => (
  <span className="font-semibold text-gray-400">{idx + 1}</span>
);

const rankCol = { key: 'rank', header: '#', align: 'left' as const, render: rankCell };

/* ---------- Country rankings ---------- */

export function PenetrationTable({ data, totalMarketEur }: { data: CountryFitnessData[]; totalMarketEur: number }) {
  void totalMarketEur;
  const columns: DataColumn<CountryFitnessData>[] = [
    rankCol,
    {
      key: 'name',
      header: 'Country',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: 'penetration',
      header: 'Penetration',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.penetration_rate,
      render: (r) => <span className="font-semibold text-brand-primary">{r.penetration_rate}%</span>,
    },
    {
      key: 'members',
      header: 'Members',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.members_millions,
      render: (r) => `${r.members_millions.toFixed(2)}M`,
    },
    {
      key: 'chains',
      header: 'Top chains',
      render: (r) => <span className="text-xs text-gray-500">{r.top_chains.slice(0, 2).join(', ')}</span>,
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.iso_code}
      searchText={(r) => `${r.name} ${r.iso_code} ${r.top_chains.join(' ')}`}
      searchPlaceholder="Search countries…"
      initialSort={{ key: 'penetration', dir: 'desc' }}
    />
  );
}

export function MarketTable({ data, totalMarketEur }: { data: CountryFitnessData[]; totalMarketEur: number }) {
  const columns: DataColumn<CountryFitnessData>[] = [
    rankCol,
    {
      key: 'name',
      header: 'Country',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: 'market',
      header: 'Revenue',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.market_size_eur,
      render: (r) => <span className="font-semibold text-emerald-600">€{formatMarketSize(r.market_size_eur)}</span>,
    },
    {
      key: 'clubs',
      header: 'Clubs',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.clubs_count,
      render: (r) => r.clubs_count.toLocaleString(),
    },
    {
      key: 'share',
      header: 'Market share',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.market_size_eur,
      render: (r) => (
        <span className="text-gray-500">{((r.market_size_eur / totalMarketEur) * 100).toFixed(1)}%</span>
      ),
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.iso_code}
      searchText={(r) => `${r.name} ${r.iso_code}`}
      searchPlaceholder="Search countries…"
      initialSort={{ key: 'market', dir: 'desc' }}
    />
  );
}

export function GrowthTable({ data }: { data: CountryFitnessData[] }) {
  const columns: DataColumn<CountryFitnessData>[] = [
    rankCol,
    {
      key: 'name',
      header: 'Country',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: 'cagr',
      header: 'CAGR (2024-31)',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.growth_cagr,
      render: (r) => <span className="font-semibold text-purple-600">{r.growth_cagr}%</span>,
    },
    {
      key: 'penetration',
      header: 'Penetration',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.penetration_rate,
      render: (r) => `${r.penetration_rate}%`,
    },
    {
      key: 'potential',
      header: 'Headroom',
      align: 'right',
      sortable: true,
      sortValue: (r) => -r.penetration_rate,
      render: (r) =>
        r.penetration_rate < 5 ? (
          <span className="font-medium text-amber-600">Very high</span>
        ) : r.penetration_rate < 10 ? (
          <span className="font-medium text-green-600">High</span>
        ) : (
          <span className="font-medium text-blue-600">Moderate</span>
        ),
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.iso_code}
      searchText={(r) => `${r.name} ${r.iso_code}`}
      searchPlaceholder="Search countries…"
      initialSort={{ key: 'cagr', dir: 'desc' }}
    />
  );
}

/* ---------- Industry tables ---------- */

export function GymChainsTable({ data }: { data: GymChainData[] }) {
  const columns: DataColumn<GymChainData>[] = [
    rankCol,
    {
      key: 'name',
      header: 'Company',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) =>
        r.website ? (
          <a href={r.website} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-primary hover:underline">
            {r.name}
          </a>
        ) : (
          <span className="font-medium text-gray-900">{r.name}</span>
        ),
    },
    { key: 'hq', header: 'HQ', render: (r) => <span className="text-gray-500">{r.country_code}</span> },
    {
      key: 'members',
      header: 'Members',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.members,
      render: (r) => <span className="font-semibold text-orange-600">{formatNumber(r.members)}</span>,
    },
    {
      key: 'locations',
      header: 'Locations',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.locations,
      render: (r) => `${r.locations.toLocaleString()}+`,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.revenue_eur ?? 0,
      render: (r) => <span className="text-emerald-600">{r.revenue_eur ? formatRevenue(r.revenue_eur) : 'N/A'}</span>,
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.name}
      searchText={(r) => `${r.name} ${r.country_code}`}
      searchPlaceholder="Search chains…"
      initialSort={{ key: 'members', dir: 'desc' }}
    />
  );
}

export function SupplementsTable({ data }: { data: SupplementCompanyData[] }) {
  const columns: DataColumn<SupplementCompanyData>[] = [
    rankCol,
    {
      key: 'name',
      header: 'Company',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) =>
        r.website ? (
          <a href={r.website} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-primary hover:underline">
            {r.name}
          </a>
        ) : (
          <span className="font-medium text-gray-900">{r.name}</span>
        ),
    },
    { key: 'hq', header: 'HQ', render: (r) => <span className="text-gray-500">{r.country_code}</span> },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.revenue_eur ?? 0,
      render: (r) => <span className="font-semibold text-emerald-600">{r.revenue_eur ? formatRevenue(r.revenue_eur) : 'N/A'}</span>,
    },
    {
      key: 'position',
      header: 'Market position',
      render: (r) => <span className="text-xs text-gray-500">{r.market_position || '-'}</span>,
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.name}
      searchText={(r) => `${r.name} ${r.country_code} ${r.market_position ?? ''}`}
      searchPlaceholder="Search companies…"
      initialSort={{ key: 'revenue', dir: 'desc' }}
    />
  );
}

export function InfluencersTable({ data }: { data: FitnessInfluencerData[] }) {
  const columns: DataColumn<FitnessInfluencerData>[] = [
    rankCol,
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    { key: 'country', header: 'Country', render: (r) => <span className="text-gray-500">{r.country_code}</span> },
    {
      key: 'instagram',
      header: 'Instagram',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.instagram_followers,
      render: (r) => <span className="font-semibold text-pink-600">{formatNumber(r.instagram_followers)}</span>,
    },
    {
      key: 'youtube',
      header: 'YouTube',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.youtube_followers ?? 0,
      render: (r) => <span className="text-red-500">{r.youtube_followers ? formatNumber(r.youtube_followers) : '-'}</span>,
    },
    {
      key: 'handle',
      header: 'Handle',
      render: (r) => <span className="text-xs text-gray-500">{r.handle}</span>,
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.name}
      searchText={(r) => `${r.name} ${r.country_code} ${r.handle} ${r.specialty}`}
      searchPlaceholder="Search creators…"
      initialSort={{ key: 'instagram', dir: 'desc' }}
    />
  );
}

export function HashtagComparisonTable({ data }: { data: HashtagData[] }) {
  const columns: DataColumn<HashtagData>[] = [
    rankCol,
    {
      key: 'hashtag',
      header: 'Hashtag',
      sortable: true,
      sortValue: (r) => r.hashtag,
      render: (r) => <span className="font-medium text-violet-700">{r.hashtag}</span>,
    },
    {
      key: 'ig',
      header: 'IG posts',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.instagram_posts,
      render: (r) => <span className="font-semibold text-pink-600">{formatNumber(r.instagram_posts)}</span>,
    },
    {
      key: 'ttviews',
      header: 'TikTok views',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.tiktok_views,
      render: (r) => <span className="font-semibold text-cyan-600">{formatNumber(r.tiktok_views)}</span>,
    },
    {
      key: 'ttvideos',
      header: 'TikTok videos',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.tiktok_videos ?? 0,
      render: (r) => (r.tiktok_videos ? formatNumber(r.tiktok_videos) : '-'),
    },
    {
      key: 'avg',
      header: 'Avg views',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.avg_views_per_video ?? 0,
      render: (r) => <span className="text-emerald-600">{r.avg_views_per_video ? formatNumber(r.avg_views_per_video) : '-'}</span>,
    },
    {
      key: 'leader',
      header: 'Leader',
      render: (r) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            r.platform_leader === 'TikTok'
              ? 'bg-cyan-100 text-cyan-700'
              : r.platform_leader === 'Instagram'
                ? 'bg-pink-100 text-pink-700'
                : 'bg-gray-100 text-gray-700'
          }`}
        >
          {r.platform_leader}
        </span>
      ),
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.hashtag}
      searchText={(r) => r.hashtag}
      searchPlaceholder="Search hashtags…"
      initialSort={{ key: 'ttviews', dir: 'desc' }}
    />
  );
}

export function ActivityTable({ data }: { data: ActivityDatum[] }) {
  const avg = EUROSTAT_ACTIVITY_META.eu27_average;
  const columns: DataColumn<ActivityDatum>[] = [
    rankCol,
    {
      key: 'name',
      header: 'Country',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => <span className="font-medium text-gray-900">{r.name}</span>,
    },
    {
      key: 'activity',
      header: 'Meets WHO guideline',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.activity_pct,
      render: (r) => <span className="font-semibold text-teal-600">{r.activity_pct}%</span>,
    },
    {
      key: 'vsavg',
      header: 'vs EU avg',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.activity_pct - avg,
      render: (r) => {
        const diff = +(r.activity_pct - avg).toFixed(1);
        return (
          <span className={diff >= 0 ? 'font-medium text-green-600' : 'font-medium text-red-500'}>
            {diff >= 0 ? '+' : ''}
            {diff} pts
          </span>
        );
      },
    },
    {
      key: 'year',
      header: 'Survey',
      align: 'right',
      render: (r) => <span className="text-xs text-gray-400">{r.year}</span>,
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.iso_code}
      searchText={(r) => `${r.name} ${r.iso_code}`}
      searchPlaceholder="Search countries…"
      initialSort={{ key: 'activity', dir: 'desc' }}
    />
  );
}

export function TikTokHashtagsTable({ data }: { data: HashtagData[] }) {
  const columns: DataColumn<HashtagData>[] = [
    rankCol,
    {
      key: 'hashtag',
      header: 'Hashtag',
      sortable: true,
      sortValue: (r) => r.hashtag,
      render: (r) => <span className="font-medium text-cyan-700">{r.hashtag}</span>,
    },
    {
      key: 'views',
      header: 'Total views',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.tiktok_views,
      render: (r) => <span className="font-semibold text-cyan-600">{formatNumber(r.tiktok_views)}</span>,
    },
    {
      key: 'videos',
      header: 'Videos',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.tiktok_videos ?? 0,
      render: (r) => (r.tiktok_videos ? formatNumber(r.tiktok_videos) : '-'),
    },
    {
      key: 'avg',
      header: 'Avg views/video',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.avg_views_per_video ?? 0,
      render: (r) => <span className="font-semibold text-emerald-600">{r.avg_views_per_video ? formatNumber(r.avg_views_per_video) : '-'}</span>,
    },
  ];
  return (
    <DataTable
      data={data}
      columns={columns}
      rowKey={(r) => r.hashtag}
      searchText={(r) => r.hashtag}
      searchPlaceholder="Search hashtags…"
      initialSort={{ key: 'avg', dir: 'desc' }}
      maxHeight="400px"
    />
  );
}
