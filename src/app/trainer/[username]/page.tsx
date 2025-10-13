// src/app/trainer/[username]/page.tsx

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Shield, CheckCircle, MapPin, Calendar, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { prisma } from '@/core/database';
import { UserRole } from '@prisma/client';

interface TrainerPageProps {
  params: {
    username: string;
  };
}

async function getTrainerByUsername(username: string) {
  // Map common username formats to email lookup
  const emailMappings: Record<string, string> = {
    'victorsole': 'vsoleferioli@gmail.com',
    'victor-sole': 'vsoleferioli@gmail.com',
    'victor.sole': 'vsoleferioli@gmail.com',
  };

  const email = emailMappings[username.toLowerCase()];

  if (!email) {
    return null;
  }

  const user = await prisma.users.findUnique({
    where: {
      email: email,
      role: UserRole.TRAINER,
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      trainerVerified: true,
      trainerBio: true,
      trainerRating: true,
      reputationScore: true,
      createdAt: true,
      city: true,
      state: true,
      country: true,
      showLocation: true,
      instagramUrl: true,
      youtubeUrl: true,
      linkedinUrl: true,
      showSocialMedia: true,
      fitnessGoals: true,
      experienceLevel: true,
      preferredWorkoutTypes: true,
      // ownedTeams and workoutLogs are not direct relations on users; fetch separately downstream
    }
  });

  return user;
}

export async function generateMetadata({ params }: TrainerPageProps): Promise<Metadata> {
  const trainer = await getTrainerByUsername(params.username);

  if (!trainer) {
    return {
      title: 'Trainer Not Found - Massimino',
      description: 'The trainer profile you are looking for could not be found.',
    };
  }

  const trainerName = trainer.name || 'Professional Trainer';
  const description = trainer.trainerBio
    ? trainer.trainerBio.slice(0, 160) + '...'
    : `${trainerName} is a NASM-certified trainer on Massimino, the safety-first fitness platform.`;

  return {
    title: `${trainerName} - NASM Certified Trainer | Massimino`,
    description,
    openGraph: {
      title: `${trainerName} - NASM Certified Trainer`,
      description,
      images: trainer.image ? [{ url: trainer.image }] : [],
      type: 'profile',
      url: `https://massimino.fitness/trainer/${params.username}`,
      siteName: 'Massimino - Safety-First Fitness Community',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${trainerName} - NASM Certified Trainer`,
      description,
      images: trainer.image ? [trainer.image] : [],
    },
  };
}

export default async function TrainerPage({ params }: TrainerPageProps) {
  const trainer = await getTrainerByUsername(params.username);

  if (!trainer) {
    notFound();
  }

  const trainerName = trainer.name || 'Professional Trainer';
  const initials = trainerName.split(' ').map((n: string) => n[0]).join('').toUpperCase();

  // Fetch derived data: owned teams and recent workout logs
  const [ownedTeams, workoutLogs] = await Promise.all([
    prisma.teams.findMany({ where: { trainerId: trainer.id }, select: { id: true, name: true, _count: { select: { members: true } } } }),
    prisma.workout_log_entries.findMany({ where: { userId: trainer.id }, select: { id: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 30 })
  ])

  // Calculate workout consistency (percentage of days with workouts in last 30 days)
  const workoutConsistency = Math.round((workoutLogs.length / 30) * 100);

  // Calculate total team members across all teams
  const totalTeamMembers = ownedTeams.reduce((total: number, team: any) => total + team._count.members, 0);

  // Format location display
  const locationParts = [trainer.city, trainer.state, trainer.country].filter(Boolean);
  const location = locationParts.join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Section */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="w-24 h-24 border-4 border-white shadow-md rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
                {trainer.image ? (
                  <img
                    src={trainer.image}
                    alt={trainerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-2xl font-bold">{initials}</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900">{trainerName}</h1>
                  {trainer.trainerVerified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      NASM Verified
                    </Badge>
                  )}
                </div>

                <p className="text-slate-600 mb-3">
                  Professional Trainer on Massimino - Safety-First Fitness Community
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  {trainer.showLocation && location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {location}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Training since {new Date(trainer.createdAt).getFullYear()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    Safety Score: {trainer.reputationScore}/100
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio Section */}
        {trainer.trainerBio && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">About {trainerName}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {trainer.trainerBio}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-600" />
                <span className="text-2xl font-bold text-slate-900">{workoutConsistency}%</span>
              </div>
              <p className="text-slate-600 text-sm">Workout Consistency</p>
              <p className="text-xs text-slate-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-6 h-6 text-green-600" />
                <span className="text-2xl font-bold text-slate-900">{totalTeamMembers}</span>
              </div>
              <p className="text-slate-600 text-sm">Team Members</p>
              <p className="text-xs text-slate-500 mt-1">Across {trainer.ownedTeams.length} teams</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <span className="text-2xl font-bold text-slate-900">{trainer.reputationScore}</span>
              </div>
              <p className="text-slate-600 text-sm">Safety Rating</p>
              <p className="text-xs text-slate-500 mt-1">Out of 100</p>
            </CardContent>
          </Card>
        </div>

        {/* Specialisations */}
        {trainer.preferredWorkoutTypes.length > 0 && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Training Specialisations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trainer.preferredWorkoutTypes.map((type: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {type}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams Section */}
        {trainer.ownedTeams.length > 0 && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">My Training Teams</CardTitle>
              <CardDescription>
                Community groups led by {trainerName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trainer.ownedTeams.map((team: any) => (
                  <div key={team.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-semibold text-slate-900">{team.name}</h3>
                      <p className="text-sm text-slate-600">{team._count.members} members</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Media Links */}
        {trainer.showSocialMedia && (trainer.instagramUrl || trainer.youtubeUrl || trainer.linkedinUrl) && (
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Connect With Me</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {trainer.instagramUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={trainer.instagramUrl} target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  </Button>
                )}
                {trainer.youtubeUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={trainer.youtubeUrl} target="_blank" rel="noopener noreferrer">
                      YouTube
                    </a>
                  </Button>
                )}
                {trainer.linkedinUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={trainer.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-2">Ready to Train Safely?</h2>
            <p className="mb-4 text-blue-100">
              Join Massimino's safety-first fitness community and train with verified professionals like {trainerName}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
                asChild
              >
                <a href="https://massimino.fitness/login">
                  Join Massimino
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-blue-600"
                asChild
              >
                <a href="https://massimino.fitness">
                  Learn More
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-slate-200">
          <p className="text-slate-500 text-sm">
            🛡️ <strong>Massimino</strong> - The Safety-First Fitness Community
          </p>
          <p className="text-slate-400 text-xs mt-1">
            NASM-certified trainers • Anti-creep protection • Professional standards
          </p>
        </div>
      </div>
    </div>
  );
}
