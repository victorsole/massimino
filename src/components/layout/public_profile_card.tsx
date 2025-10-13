// src/components/layout/public_profile_card.tsx

'use client';

import { Shield, CheckCircle, MapPin, Users, TrendingUp, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PublicProfileCardProps {
  trainer: {
    id: string;
    name: string;
    email: string;
    image?: string;
    trainerVerified: boolean;
    trainerBio?: string;
    trainerRating?: number;
    reputationScore: number;
    city?: string;
    state?: string;
    country?: string;
    showLocation: boolean;
    instagramUrl?: string;
    youtubeUrl?: string;
    linkedinUrl?: string;
    showSocialMedia: boolean;
    preferredWorkoutTypes: string[];
    ownedTeams: Array<{
      id: string;
      name: string;
      _count: {
        members: number;
      };
    }>;
    workoutLogs: Array<{
      id: string;
      createdAt: Date;
    }>;
    createdAt: Date;
  };
  username: string;
  variant?: 'compact' | 'full';
  className?: string;
}

export default function PublicProfileCard({
  trainer,
  username,
  variant = 'full',
  className = ''
}: PublicProfileCardProps) {
  const trainerName = trainer.name || 'Professional Trainer';
  const initials = trainerName.split(' ').map(n => n[0]).join('').toUpperCase();

  // Calculate workout consistency (percentage of days with workouts in last 30 days)
  const workoutConsistency = Math.round((trainer.workoutLogs.length / 30) * 100);

  // Calculate total team members across all teams
  const totalTeamMembers = trainer.ownedTeams.reduce((total, team) => total + team._count.members, 0);

  // Format location display
  const locationParts = [trainer.city, trainer.state, trainer.country].filter(Boolean);
  const location = locationParts.join(', ');

  if (variant === 'compact') {
    return (
      <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-white shadow-md rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
              {trainer.image ? (
                <img
                  src={trainer.image}
                  alt={trainerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-lg font-bold">{initials}</span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-900">{trainerName}</h3>
                {trainer.trainerVerified && (
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    NASM
                  </Badge>
                )}
              </div>

              <p className="text-sm text-slate-600 mb-2">
                Professional Trainer • Safety Score: {trainer.reputationScore}/100
              </p>

              <div className="flex gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {workoutConsistency}% Consistency
                </div>
                {totalTeamMembers > 0 && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {totalTeamMembers} Members
                  </div>
                )}
              </div>
            </div>

            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              asChild
            >
              <a
                href={`/trainer/${username}`}
                className="flex items-center gap-1"
              >
                View Profile
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 shadow-lg ${className}`}>
      {/* Header Section */}
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 border-4 border-white shadow-md rounded-full overflow-hidden bg-blue-600 flex items-center justify-center">
            {trainer.image ? (
              <img
                src={trainer.image}
                alt={trainerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-xl font-bold">{initials}</span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-2xl">{trainerName}</CardTitle>
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

            <div className="flex flex-wrap gap-3 text-sm text-slate-500">
              {trainer.showLocation && location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Safety Score: {trainer.reputationScore}/100
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Bio Section */}
        {trainer.trainerBio && (
          <div className="mb-6">
            <p className="text-slate-700 leading-relaxed line-clamp-3">
              {trainer.trainerBio}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">{workoutConsistency}%</span>
            </div>
            <p className="text-xs text-slate-600">Consistency</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-5 h-5 text-green-600" />
              <span className="text-xl font-bold text-slate-900">{totalTeamMembers}</span>
            </div>
            <p className="text-xs text-slate-600">Members</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="text-xl font-bold text-slate-900">{trainer.reputationScore}</span>
            </div>
            <p className="text-xs text-slate-600">Safety</p>
          </div>
        </div>

        {/* Specialisations */}
        {trainer.preferredWorkoutTypes.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Specialisations</h4>
            <div className="flex flex-wrap gap-2">
              {trainer.preferredWorkoutTypes.slice(0, 3).map((type, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {type}
                </Badge>
              ))}
              {trainer.preferredWorkoutTypes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{trainer.preferredWorkoutTypes.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Social Media Links */}
        {trainer.showSocialMedia && (trainer.instagramUrl || trainer.youtubeUrl || trainer.linkedinUrl) && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Connect</h4>
            <div className="flex flex-wrap gap-2">
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
          </div>
        )}

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            asChild
          >
            <a href={`/trainer/${username}`}>
              View Full Profile
            </a>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            asChild
          >
            <a href="https://massimino.fitness/login">
              Join Massimino
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for embedding in other pages
export function MassitreeProfileEmbed({
  trainer,
  username,
  className = ''
}: {
  trainer: PublicProfileCardProps['trainer'];
  username: string;
  className?: string;
}) {
  return (
    <div className={`bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg ${className}`}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            🛡️ Massimino Trainer
          </h2>
          <p className="text-sm text-slate-600">
            Safety-First Fitness Community
          </p>
        </div>
        <PublicProfileCard
          trainer={trainer}
          username={username}
          variant="compact"
        />
      </div>
    </div>
  );
}