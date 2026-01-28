'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, MapPin, Lock } from 'lucide-react';

type Athlete = {
  id: string;
  name: string;
  slug: string;
  eraLabel: string;
  yearsActive: string;
  achievements: string[];
  bio: string;
  imageUrl: string | null;
  nationality: string | null;
  birthYear: number | null;
  discipline: string;
  isPremium: boolean;
  displayOrder: number;
};

export function AthleteGallery() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAthletes();
  }, [filter]);

  const fetchAthletes = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('discipline', filter);
      }

      const res = await fetch(`/api/athletes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAthletes(data);
      }
    } catch (error) {
      console.error('Failed to fetch athletes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Loading legendary athletes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Workout Like A Master</h1>
        <p className="text-gray-600 mt-2">
          Train with the exact programs used by legendary athletes throughout their careers
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Disciplines
        </button>
        <button
          onClick={() => setFilter('BODYBUILDING')}
          className={`px-4 py-2 rounded-md ${
            filter === 'BODYBUILDING'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Bodybuilding
        </button>
        <button
          onClick={() => setFilter('POWERLIFTING')}
          className={`px-4 py-2 rounded-md ${
            filter === 'POWERLIFTING'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Powerlifting
        </button>
        <button
          onClick={() => setFilter('CROSSFIT')}
          className={`px-4 py-2 rounded-md ${
            filter === 'CROSSFIT'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          CrossFit
        </button>
      </div>

      {/* Athletes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {athletes.map((athlete) => (
          <Link
            key={athlete.id}
            href={`/workout-log/athletes/${athlete.slug}`}
            className="block"
          >
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {athlete.name}
                      {athlete.isPremium && (
                        <Lock className="h-4 w-4 text-yellow-600" />
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {athlete.eraLabel}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{athlete.discipline}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {athlete.yearsActive}
                  </div>
                  {athlete.nationality && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {athlete.nationality}
                    </div>
                  )}
                </div>

                {/* Achievements */}
                <div>
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                    <Trophy className="h-4 w-4" />
                    Top Achievements
                  </div>
                  <ul className="space-y-1">
                    {athlete.achievements.slice(0, 3).map((achievement, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bio Preview */}
                <p className="text-sm text-gray-600 line-clamp-3">
                  {athlete.bio}
                </p>

                {/* CTA */}
                <div className="pt-2">
                  <div className="text-blue-600 text-sm font-medium hover:underline">
                    View Programs →
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {athletes.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No athletes found for this discipline
        </div>
      )}
    </div>
  );
}
