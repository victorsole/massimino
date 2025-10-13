/**
 * Teams API - Phase 2 Implementation
 * Main API route for team operations: create, list, discovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { TeamService } from '@/services/teams/team_service';
import { CreateTeamRequest, TeamDiscoveryFilters } from '@/types/teams';
import { isTrainer, isActiveUser, isAdmin } from '@/types/auth';

// ============================================================================
// GET - Team Discovery and List Operations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const action = searchParams.get('action') || 'list';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (action === 'discovery') {
      // Public team discovery - no authentication required
      const filters: TeamDiscoveryFilters = {
        type: searchParams.get('type')?.split(',') as any,
        trainerVerified: searchParams.get('trainerVerified') === 'true',
        hasSpots: searchParams.get('hasSpots') === 'true'
      };

      const searchQuery = searchParams.get('search');
      if (searchQuery) filters.searchQuery = searchQuery;

      const city = searchParams.get('city');
      if (city) {
        filters.location = { city };
        const state = searchParams.get('state');
        const radiusStr = searchParams.get('radius');
        if (state) filters.location.state = state;
        if (radiusStr) filters.location.radius = parseInt(radiusStr);
      }

      const { teams, total } = await TeamService.discover(filters, page, limit);

      return NextResponse.json({
        success: true,
        data: {
          teams,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            hasNextPage: page < Math.ceil(total / limit),
            hasPreviousPage: page > 1
          }
        }
      });
    }

    // Authentication required for other operations
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isActiveUser(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Account not in good standing' },
        { status: 403 }
      );
    }

    if (action === 'my-teams') {
      // Get trainer's or admin's teams
      const user = session.user as any;
      if (!isTrainer(user) && !isAdmin(user)) {
        return NextResponse.json(
          { success: false, error: 'Only trainers and administrators can view their teams' },
          { status: 403 }
        );
      }

      const teams = await TeamService.getTrainerTeams(session.user.id);

      return NextResponse.json({
        success: true,
        data: {
          teams,
          total: teams.length
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Teams GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Team Creation and Actions
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (!isActiveUser(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Account not in good standing' },
        { status: 403 }
      );
    }

    const user = session.user as any;
      if (!isTrainer(user) && !isAdmin(user)) {
        return NextResponse.json(
          { success: false, error: 'Only verified trainers and administrators can create teams' },
          { status: 403 }
        );
      }

    const body = await request.json();
    const { action } = body;

    if (action === 'create' || !action) {
      // Create new team
      // Normalise snake_case inputs
      const name = body.name;
      const description = body.description;
      const type = body.type;
      const customTypeDescription = body.custom_type_description ?? body.customTypeDescription;
      const visibility = body.visibility ?? body.team_visibility;
      const maxMembers = body.max_members ?? body.maxMembers;
      const spotifyPlaylistUrl = body.spotify_playlist_url ?? body.spotifyPlaylistUrl;
      const allowComments = body.allow_comments ?? body.allowComments;
      const allowMemberInvites = body.allow_member_invites ?? body.allowMemberInvites;
      const aesthetic_settings_in = body.aesthetic_settings ?? body.aestheticSettings;
      const aestheticSettings = aesthetic_settings_in ? {
        primaryColor: aesthetic_settings_in.primary_colour ?? aesthetic_settings_in.primaryColor,
        secondaryColor: aesthetic_settings_in.secondary_colour ?? aesthetic_settings_in.secondaryColor,
        backgroundColor: aesthetic_settings_in.background_colour ?? aesthetic_settings_in.backgroundColor,
        fontStyle: aesthetic_settings_in.font_style ?? aesthetic_settings_in.fontStyle,
        theme: aesthetic_settings_in.theme,
        logoUrl: aesthetic_settings_in.logo_url ?? aesthetic_settings_in.logoUrl,
        bannerUrl: aesthetic_settings_in.banner_url ?? aesthetic_settings_in.bannerUrl,
        customClasses: aesthetic_settings_in.custom_classes ?? aesthetic_settings_in.customClasses,
        animations: aesthetic_settings_in.animations ? {
          enableCardHover: aesthetic_settings_in.animations.enable_card_hover ?? aesthetic_settings_in.animations.enableCardHover,
          enableBannerWave: aesthetic_settings_in.animations.enable_banner_wave ?? aesthetic_settings_in.animations.enableBannerWave,
          enableSectionFade: aesthetic_settings_in.animations.enable_section_fade ?? aesthetic_settings_in.animations.enableSectionFade,
        } : undefined,
      } : undefined;

      // Validate required fields
      if (!name || !type) {
        return NextResponse.json(
          { success: false, error: 'Team name and type are required' },
          { status: 400 }
        );
      }

      // Check if trainer can create more teams
      const canCreate = await TeamService.canTrainerCreate(session.user.id);
      if (!canCreate.canCreate) {
        return NextResponse.json(
          { success: false, error: canCreate.reason },
          { status: 400 }
        );
      }

      // Validate team data
      const createRequest: CreateTeamRequest = {
        name,
        description,
        type,
        customTypeDescription,
        visibility: visibility || 'PUBLIC',
        maxMembers: maxMembers || 20,
        aestheticSettings: aestheticSettings || {},
        spotifyPlaylistUrl,
        allowComments: allowComments !== false,
        allowMemberInvites: allowMemberInvites !== false
      };

      const validation = TeamService.validateCreation(createRequest);
      if (!validation.isValid) {
        return NextResponse.json(
          { success: false, error: validation.errors.join(', ') },
          { status: 400 }
        );
      }

      // Create the team
      const team = await TeamService.create(session.user.id, createRequest);

      return NextResponse.json({
        success: true,
        data: team,
        message: 'Team created successfully'
      }, { status: 201 });
    }

    if (action === 'apply') {
      // Apply to join a team
      const { teamId, message } = body;

      if (!teamId) {
        return NextResponse.json(
          { success: false, error: 'Team ID is required' },
          { status: 400 }
        );
      }

      // Check if user can join team
      const canJoin = await TeamService.canUserJoin(teamId, session.user.id);
      if (!canJoin.canJoin) {
        return NextResponse.json(
          { success: false, error: canJoin.reason },
          { status: 400 }
        );
      }

      const application = await TeamService.applyToJoin(teamId, session.user.id, message);

      return NextResponse.json({
        success: true,
        data: application,
        message: 'Application submitted successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Teams POST API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('already a member')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
