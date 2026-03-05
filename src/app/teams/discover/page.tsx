/**
 * Teams Discovery Page
 * Public page for discovering and joining teams
 */

import Image from 'next/image';
import { TeamInterface } from '@/components/teams/team_interface';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

async function getHeroImage(): Promise<{ src: string; photographer: string } | null> {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(
      'https://api.pexels.com/v1/search?query=sports+team+fitness&per_page=5&orientation=landscape',
      {
        headers: { Authorization: PEXELS_API_KEY },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;
    return { src: photo.src.large2x || photo.src.large, photographer: photo.photographer };
  } catch {
    return null;
  }
}

export default async function TeamsDiscoverPage() {
  const hero = await getHeroImage();

  return (
    <div className="min-h-screen bg-[#fcfaf5]">
      {/* Hero banner */}
      <div className="relative bg-[#2b5069] overflow-hidden">
        {/* Pexels background image */}
        {hero && (
          <Image
            src={hero.src}
            alt="Sports team"
            fill
            className="object-cover opacity-30"
            priority
            sizes="100vw"
          />
        )}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2b5069]/60 via-[#2b5069]/40 to-[#2b5069]/80" />
        {/* Decorative blur circles */}
        <div className="absolute top-[-80px] right-[-60px] w-72 h-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-40px] left-[-40px] w-56 h-56 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white uppercase tracking-wider">
            Find Your Team
          </h1>
          <p className="mt-3 text-white/70 font-body text-base sm:text-lg max-w-xl mx-auto">
            Join a fitness community, train together, and push each other to new heights
          </p>
          {hero && (
            <p className="mt-6 text-white/30 text-xs font-body">
              Photo by {hero.photographer} on Pexels
            </p>
          )}
        </div>
      </div>

      {/* Content area floats above hero edge */}
      <div className="relative z-20 -mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <TeamInterface mode="discovery" />
      </div>
    </div>
  );
}
