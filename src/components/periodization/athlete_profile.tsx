'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, MapPin, BookOpen, Dumbbell, Lock } from 'lucide-react';
import Link from 'next/link';

type AthleteProfile = {
  id: string;
  name: string;
  slug: string;
  eraLabel: string;
  yearsActive: string;
  achievements: string[];
  bio: string;
  trainingPhilosophy: string;
  imageUrl: string | null;
  videoUrl: string | null;
  nationality: string | null;
  birthYear: number | null;
  discipline: string;
  isPremium: boolean;
  athlete_training_phases: Array<{
    id: string;
    phaseName: string;
    era: string;
    description: string;
    trainingPhilosophy: string;
    durationWeeks: number;
    frequency: number;
    volumeLevel: string;
    intensityLevel: string;
    nutrition: any;
    keyPrinciples: string[];
    famousQuotes: string[];
  }>;
  program_templates: Array<{
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
  }>;
};

type Props = {
  slug: string;
};

export function AthleteProfile({ slug }: Props) {
  const [athlete, setAthlete] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAthlete();
  }, [slug]);

  const fetchAthlete = async () => {
    try {
      const res = await fetch(`/api/athletes/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setAthlete(data);
      }
    } catch (error) {
      console.error('Failed to fetch athlete:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-gray-500">Loading athlete profile...</div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Athlete not found</h2>
        <p className="text-gray-600 mt-2">This legendary athlete doesn't exist</p>
        <Link href="/workout-log/athletes">
          <Button variant="outline" className="mt-4">
            View All Athletes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{athlete.name}</h1>
              {athlete.isPremium && (
                <Badge className="bg-yellow-500 text-yellow-900">
                  <Lock className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-blue-100 text-lg">{athlete.eraLabel}</p>
            <div className="flex items-center gap-6 mt-4 text-blue-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {athlete.yearsActive}
              </div>
              {athlete.nationality && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {athlete.nationality}
                </div>
              )}
              <Badge variant="secondary">{athlete.discipline}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Legendary Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {athlete.achievements.map((achievement, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-600 font-bold">•</span>
                <span className="text-gray-700">{achievement}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Biography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Biography
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{athlete.bio}</p>
        </CardContent>
      </Card>

      {/* Training Philosophy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Training Philosophy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{athlete.trainingPhilosophy}</p>
        </CardContent>
      </Card>

      {/* Training Phases */}
      {athlete.athlete_training_phases.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Training Phases</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {athlete.athlete_training_phases.map((phase) => (
              <Card key={phase.id} className="border-2 border-gray-200">
                <CardHeader>
                  <CardTitle>{phase.phaseName}</CardTitle>
                  <CardDescription>{phase.era}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{phase.description}</p>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span>
                      <p className="text-gray-600">{phase.durationWeeks} weeks</p>
                    </div>
                    <div>
                      <span className="font-medium">Frequency:</span>
                      <p className="text-gray-600">{phase.frequency} days/week</p>
                    </div>
                    <div>
                      <span className="font-medium">Volume:</span>
                      <p className="text-gray-600">{phase.volumeLevel}</p>
                    </div>
                    <div>
                      <span className="font-medium">Intensity:</span>
                      <p className="text-gray-600">{phase.intensityLevel}</p>
                    </div>
                  </div>

                  {phase.famousQuotes.length > 0 && (
                    <div className="border-l-4 border-blue-500 pl-4 italic text-gray-600 text-sm">
                      "{phase.famousQuotes[0]}"
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Programs */}
      {athlete.program_templates.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Available Programs</h2>
          <div className="grid grid-cols-1 gap-4">
            {athlete.program_templates.map((program) => (
              <Card key={program.id} className="border-2 border-blue-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{program.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {program.duration} • {program.difficulty} • {program.category}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{program.rating?.toFixed(1) || 'New'}</span>
                      {program.ratingCount > 0 && (
                        <span className="text-sm text-gray-500">({program.ratingCount})</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700">{program.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {program.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    {program.hasExerciseSlots && (
                      <Badge variant="secondary">Customizable</Badge>
                    )}
                    <Badge variant="secondary">{program.programType}</Badge>
                    {program.progressionStrategy && (
                      <Badge variant="secondary">{program.progressionStrategy}</Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/workout-log/programs/${program.id}`} className="flex-1">
                      <Button className="w-full">View Program Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-center pt-4">
        <Link href="/workout-log/athletes">
          <Button variant="outline">← Back to All Athletes</Button>
        </Link>
      </div>
    </div>
  );
}
