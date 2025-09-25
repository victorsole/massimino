/**
 * Workout Marketplace API Route
 * Handles marketplace functionality for templates and programs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import {
  getMarketplaceTemplates,
  getMarketplacePrograms,
  getFeaturedContent,
  getTopRatedContent,
  getPopularContent,
  getRecommendedContent
} from '@/core/database';

// ============================================================================
// GET /api/workout/marketplace
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const priceRange = searchParams.get('priceRange');
    const sortBy = searchParams.get('sortBy') || 'popular';
    const limit = parseInt(searchParams.get('limit') || '20');

    const filters = {
      category,
      difficulty,
      priceRange,
      sortBy,
      limit
    };

    switch (type) {
      case 'templates':
        const templates = await getMarketplaceTemplates(filters);
        return NextResponse.json(templates);

      case 'programs':
        const programs = await getMarketplacePrograms(filters);
        return NextResponse.json(programs);

      case 'featured':
        const featured = await getFeaturedContent();
        return NextResponse.json(featured);

      case 'top-rated':
        const topRated = await getTopRatedContent();
        return NextResponse.json(topRated);

      case 'popular':
        const popular = await getPopularContent();
        return NextResponse.json(popular);

      case 'recommended':
        // Get session for personalized recommendations
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        const recommended = await getRecommendedContent(userId);
        return NextResponse.json(recommended);

      default:
        // Return marketplace overview with all categories
        const [
          featuredContent,
          topRatedContent,
          popularContent,
          marketplaceTemplates,
          marketplacePrograms
        ] = await Promise.all([
          getFeaturedContent(),
          getTopRatedContent(),
          getPopularContent(),
          getMarketplaceTemplates({ ...filters, limit: 10 }),
          getMarketplacePrograms({ ...filters, limit: 10 })
        ]);

        return NextResponse.json({
          featured: featuredContent,
          topRated: topRatedContent,
          popular: popularContent,
          templates: marketplaceTemplates,
          programs: marketplacePrograms
        });
    }
  } catch (error) {
    console.error('Error fetching marketplace data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}