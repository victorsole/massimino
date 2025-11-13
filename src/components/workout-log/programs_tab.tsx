"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Dumbbell, Calendar, Target, TrendingUp, Filter, SortAsc } from 'lucide-react';

type ProgramTemplate = {
  id: string;
  name: string;
  description: string;
  duration: string;
  difficulty: string;
  category: string;
  rating: number;
  ratingCount: number;
  tags: string[];
  programType: string;
  hasExerciseSlots: boolean;
  progressionStrategy: string;
  legendary_athlete: {
    name: string;
    slug: string;
    eraLabel: string;
    imageUrl: string | null;
  } | null;
  program_phases: Array<{
    phaseName: string;
    phaseType: string;
    startWeek: number;
    endWeek: number;
  }>;
  phaseCount: number;
  slotCount: number;
  isCustomizable: boolean;
  author: string;
};

export function ProgramsTab() {
  const [programs, setPrograms] = useState<ProgramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popularity' | 'duration' | 'difficulty' | 'new'>('popularity');
  const [equipmentFilters, setEquipmentFilters] = useState<string[]>([]);

  // Initialize state from URL
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const sort = params.get('sort');
      const equip = params.get('equip');
      if (type) setFilter(type);
      if (sort === 'duration' || sort === 'difficulty' || sort === 'new' || sort === 'popularity') {
        setSortBy(sort);
      }
      if (equip) setEquipmentFilters(equip.split(','));
    } catch {}
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [filter]);

  const fetchPrograms = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('type', filter);
      }

      const res = await fetch(`/api/workout/programs/templates?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPrograms(json.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch programs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update URL with current UI state (type, sort, equip)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (filter && filter !== 'all') params.set('type', filter); else params.delete('type');
      if (sortBy && sortBy !== 'popularity') params.set('sort', sortBy); else params.delete('sort');
      if (equipmentFilters.length) params.set('equip', equipmentFilters.join(',')); else params.delete('equip');
      const query = params.toString();
      const url = query ? `/workout-log?tab=programs&${query}` : `/workout-log?tab=programs`;
      // Keep it client-side without navigation
      window.history.replaceState(null, '', url);
    } catch {}
  }, [filter, sortBy, equipmentFilters]);

  // Local helpers
  const parseWeeks = (durationStr?: string) => {
    if (!durationStr) return 0;
    const m = durationStr.match(/(\d+)\s*week/i);
    return m ? parseInt(m[1], 10) : 0;
  };

  const equipmentFromTags = (tags: string[] = []): string[] => {
    const known = ['barbell', 'dumbbell', 'machine', 'cable', 'kettlebell', 'bodyweight', 'bands', 'bench'];
    const set = new Set<string>();
    for (const t of tags) {
      const low = t.toLowerCase();
      if (known.includes(low)) set.add(low);
      if (low.includes('home')) set.add('home');
      if (low.includes('gym')) set.add('gym');
    }
    return Array.from(set);
  };

  const satisfiesEquipmentFilter = (p: ProgramTemplate) => {
    if (!equipmentFilters.length) return true;
    const equipTags = equipmentFromTags(p.tags || []);
    // Map quick filters to tag concepts
    const wantsHome = equipmentFilters.includes('home');
    const wantsGym = equipmentFilters.includes('gym');
    const wantsBody = equipmentFilters.includes('bodyweight');
    const okHome = !wantsHome || equipTags.includes('home') || equipTags.includes('bodyweight');
    const okGym = !wantsGym || equipTags.includes('gym') || equipTags.some(e => ['barbell','machine','cable','bench'].includes(e));
    const okBody = !wantsBody || equipTags.includes('bodyweight');
    return okHome && okGym && okBody;
  };

  const sortedFilteredPrograms = useMemo(() => {
    const base = programs.filter(satisfiesEquipmentFilter);
    const arr = [...base];
    switch (sortBy) {
      case 'duration':
        arr.sort((a,b) => parseWeeks(a.duration) - parseWeeks(b.duration));
        break;
      case 'difficulty':
        const order = ['BEGINNER','INTERMEDIATE','ADVANCED'];
        arr.sort((a,b) => order.indexOf((a.difficulty||'').toUpperCase()) - order.indexOf((b.difficulty||'').toUpperCase()));
        break;
      case 'new':
        // No createdAt available; approximate by ratingCount ascending (newer => fewer ratings)
        arr.sort((a,b) => (a.ratingCount||0) - (b.ratingCount||0));
        break;
      case 'popularity':
      default:
        arr.sort((a,b) => (b.rating||0) - (a.rating||0));
        break;
    }
    return arr;
  }, [programs, sortBy, equipmentFilters]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-9 w-40 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_,i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="h-5 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/3 bg-gray-100 rounded mt-2" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded" />
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-8 w-24 bg-gray-100 rounded" />
                <div className="h-8 w-24 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Training Programs</h2>
          <p className="text-gray-600">Choose a program and start your journey</p>
        </div>
        <Link href="/workout-log/athletes">
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            View All Athletes
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Programs
        </button>
        <button
          onClick={() => setFilter('ATHLETE')}
          className={`px-4 py-2 rounded-md ${
            filter === 'ATHLETE'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Train Like A Master
        </button>
        <button
          onClick={() => setFilter('PERIODIZATION')}
          className={`px-4 py-2 rounded-md ${
            filter === 'PERIODIZATION'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Periodization Templates
        </button>
        <button
          onClick={() => setFilter('LIFESTYLE')}
          className={`px-4 py-2 rounded-md ${
            filter === 'LIFESTYLE'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Lifestyle Programs
        </button>
        <button
          onClick={() => setFilter('COMPONENT')}
          className={`px-4 py-2 rounded-md ${
            filter === 'COMPONENT'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Movement Essentials
        </button>
        <button
          onClick={() => setFilter('CASTELLERS')}
          className={`px-4 py-2 rounded-md ${
            filter === 'CASTELLERS'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🏰 Castellers
        </button>
        <span className="ml-2 text-sm text-gray-500 flex items-center gap-1"><Filter className="h-4 w-4" /> Equipment:</span>
        {['home','gym','bodyweight'].map((eq) => (
          <button
            key={eq}
            onClick={() => setEquipmentFilters((prev) => prev.includes(eq) ? prev.filter(e => e!==eq) : [...prev, eq])}
            className={`px-3 py-1.5 rounded-md text-sm border ${equipmentFilters.includes(eq) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            aria-pressed={equipmentFilters.includes(eq)}
          >
            {eq.charAt(0).toUpperCase()+eq.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setEquipmentFilters([])}
          className="ml-1 px-3 py-1.5 rounded-md text-sm text-gray-600 hover:bg-gray-100"
        >
          Clear
        </button>

        <div className="ml-auto flex items-center gap-2">
          <SortAsc className="h-4 w-4 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-md bg-white"
            aria-label="Sort programs"
          >
            <option value="popularity">Most popular</option>
            <option value="duration">Shortest duration</option>
            <option value="difficulty">Easiest first</option>
            <option value="new">Newest</option>
          </select>
        </div>
      </div>

      {/* Result count */}
      <div className="text-sm text-gray-600">{sortedFilteredPrograms.length} results</div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedFilteredPrograms.map((program) => (
          <Card key={program.id} className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{program.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {program.legendary_athlete ? (
                      <span className="text-blue-600 font-medium">
                        By {program.legendary_athlete.name}
                      </span>
                    ) : (
                      <span>By {program.author}</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{program.rating?.toFixed(1) || 'New'}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Description */}
              <p className="text-gray-700 text-sm line-clamp-2">{program.description}</p>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>{program.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-500" />
                  <span>{program.difficulty}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Dumbbell className="h-4 w-4 text-gray-500" />
                  <span>{program.phaseCount} phases</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                  <span>{program.progressionStrategy || 'Custom'}</span>
                </div>
              </div>

              {/* Commitments (best-effort parse) */}
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                {(() => {
                  const m = program.description?.match(/(\d+)\s*(days|x)\s*\/\s*week|([1-7])\s*days\s*per\s*week/i);
                  const days = m ? (m[1] || m[3]) : '';
                  return days ? <Badge variant="outline">{days} days/week</Badge> : null;
                })()}
                {(() => {
                  const m = program.description?.match(/(~?\s*\d+\s*(min|minutes|m)\b)/i);
                  const t = m ? m[1] : '';
                  return t ? <Badge variant="outline">~{String(t).replace(/~|\s+/g,'')}</Badge> : null;
                })()}
                {(() => {
                  const equip = equipmentFromTags(program.tags || []);
                  if (!equip.length) return null;
                  const label = equip.includes('bodyweight') ? 'Bodyweight' : equip.slice(0,3).join(', ');
                  return <Badge variant="outline">Req: {label}</Badge>;
                })()}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{program.programType}</Badge>
                {program.isCustomizable && (
                  <Badge variant="outline">Customizable</Badge>
                )}
                {program.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>

              {/* Phases Preview */}
              {program.program_phases.length > 0 && (
                <div className="border-t pt-3">
                  <div className="text-xs font-medium text-gray-700 mb-2">Program Structure:</div>
                  <div className="flex flex-wrap gap-1">
                    {program.program_phases.map((phase, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {phase.phaseName}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href={`/workout-log/programs/${program.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">View Details</Button>
                </Link>
                <Link href={`/workout-log/programs/${program.id}/join`} className="flex-1">
                  <Button className="w-full">Start Program</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedFilteredPrograms.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-600">
          <div className="text-lg font-medium mb-2">No programs match your filters</div>
          <div className="mb-4">Try clearing filters or changing the category.</div>
          <Button variant="outline" onClick={() => { setFilter('all'); setEquipmentFilters([]); setSortBy('popularity'); }}>Reset Filters</Button>
        </div>
      )}
    </div>
  );
}
