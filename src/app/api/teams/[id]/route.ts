/**
 * Team-Specific API - Phase 2 Implementation
 * Handle all operations for a specific team: update, invite, join, members, messages, workout-logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { TeamService } from '@/services/teams/team_service';
import { UpdateTeamRequest, TeamMessageType } from '@/types/teams';
import { isActiveUser } from '@/types/auth';

// ============================================================================
// GET - Get Team Details, Members, Messages, Workout Logs
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const { id: teamId } = await params;

    const action = searchParams.get('action') || 'details';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (action === 'details') {
      // Get team details - public for discovery, full details for members
      const team = await TeamService.getById(teamId);

      if (!team) {
        return NextResponse.json(
          { success: false, error: 'Team not found' },
          { status: 404 }
        );
      }

      // Check if user has access to full team details
      const hasAccess = session?.user?.id && (
        TeamService.canManage(team, session.user.id) ||
        TeamService.isMember(team, session.user.id)
      );

      // Return limited info for non-members of private teams
      if (team.visibility === 'PRIVATE' && !hasAccess) {
        return NextResponse.json({
          success: true,
          data: {
            id: team.id,
            name: team.name,
            type: team.type,
            visibility: team.visibility,
            memberCount: team.memberCount,
            maxMembers: team.maxMembers,
            trainer: team.trainer
          }
        });
      }

      return NextResponse.json({
        success: true,
        data: team
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

    if (action === 'members') {
      // Get team members (requires membership)
      const team = await TeamService.getById(teamId);
      if (!team || !TeamService.isMember(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          members: team.members || []
        }
      });
    }

    if (action === 'messages') {
      // Get team messages (requires membership)
      const team = await TeamService.getById(teamId);
      if (!team || (!TeamService.isMember(team, session.user.id) && !TeamService.canManage(team, session.user.id))) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      const messages = await TeamService.getMessages(teamId, page, limit);

      return NextResponse.json({
        success: true,
        data: {
          messages,
          pagination: {
            page,
            limit,
            hasMore: messages.length === limit
          }
        }
      });
    }

    if (action === 'workout-logs') {
      // Get team workout logs (requires membership)
      const team = await TeamService.getById(teamId);
      if (!team || (!TeamService.isMember(team, session.user.id) && !TeamService.canManage(team, session.user.id))) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      const workouts = await TeamService.getWorkouts(teamId, page, limit);

      return NextResponse.json({
        success: true,
        data: {
          workouts,
          pagination: {
            page,
            limit,
            hasMore: workouts.length === limit
          }
        }
      });
    }

    if (action === 'applications') {
      // Get team applications (trainers only)
      const team = await TeamService.getById(teamId);
      if (!team || !TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      const applications = await TeamService.getApplications(teamId);

      return NextResponse.json({
        success: true,
        data: {
          applications
        }
      });
    }

    if (action === 'invitations') {
      // Get team email invitations (trainers only)
      const team = await TeamService.getById(teamId);
      if (!team || !TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }

      const { TeamInvitationService } = await import('@/services/teams/team_service');
      const status = searchParams.get('status') || undefined;
      const invitations = await TeamInvitationService.getTeamInvitations(teamId, status);

      return NextResponse.json({
        success: true,
        data: {
          invitations
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Team GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PUT - Update Team Settings
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: teamId } = await params;

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

    const team = await TeamService.getById(teamId);
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Only the team owner (trainer) can update settings
    if (!TeamService.canManage(team, session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Only the team owner can update settings' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Normalise snake_case and camelCase inputs to service shape
    const aesthetic_settings_in = body.aesthetic_settings ?? body.aestheticSettings;
    let aestheticSettings: any = undefined;
    if (aesthetic_settings_in) {
      const a = aesthetic_settings_in;
      aestheticSettings = {
        // colours (accept both spellings)
        primaryColor: a.primary_colour ?? a.primaryColor ?? a.primary_color ?? undefined,
        secondaryColor: a.secondary_colour ?? a.secondaryColor ?? a.secondary_color ?? undefined,
        backgroundColor: a.background_colour ?? a.backgroundColor ?? a.background_color ?? undefined,
        // typography/theme/media
        fontStyle: a.font_style ?? a.fontStyle ?? undefined,
        theme: a.theme ?? undefined,
        logoUrl: a.logo_url ?? a.logoUrl ?? undefined,
        bannerUrl: a.banner_url ?? a.bannerUrl ?? undefined,
        customClasses: a.custom_classes ?? a.customClasses ?? undefined,
        // animations nested
        animations: a.animations ? {
          enableCardHover: a.animations.enable_card_hover ?? a.animations.enableCardHover ?? false,
          enableBannerWave: a.animations.enable_banner_wave ?? a.animations.enableBannerWave ?? false,
          enableSectionFade: a.animations.enable_section_fade ?? a.animations.enableSectionFade ?? false,
        } : undefined,
        socialLinks: a.social_links ? {
          instagramUrl: a.social_links.instagram_url ?? a.social_links.instagramUrl ?? undefined,
          tiktokUrl: a.social_links.tiktok_url ?? a.social_links.tiktokUrl ?? undefined,
          facebookUrl: a.social_links.facebook_url ?? a.social_links.facebookUrl ?? undefined,
          youtubeUrl: a.social_links.youtube_url ?? a.social_links.youtubeUrl ?? undefined,
        } : (a.socialLinks || undefined),
        gallery: a.gallery ?? undefined,
      };
      // Remove undefined keys to avoid overwriting existing
      Object.keys(aestheticSettings).forEach((k) => (aestheticSettings[k] === undefined) && delete aestheticSettings[k]);
      if (aestheticSettings.animations && Object.values(aestheticSettings.animations).every((v) => v === undefined)) {
        delete aestheticSettings.animations;
      }
    }

    const spotifyPlaylistUrl = body.spotify_playlist_url ?? body.spotifyPlaylistUrl;
    const updateData: UpdateTeamRequest = {
      name: body.name,
      description: body.description,
      visibility: body.visibility ?? body.team_visibility,
      maxMembers: body.max_members ?? body.maxMembers,
      aestheticSettings,
      spotifyPlaylistUrl,
      allowComments: body.allow_comments ?? body.allowComments,
      allowMemberInvites: body.allow_member_invites ?? body.allowMemberInvites,
      isActive: body.is_active ?? body.isActive
    } as any;

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateTeamRequest] === undefined) {
        delete updateData[key as keyof UpdateTeamRequest];
      }
    });

    const updatedTeam = await TeamService.update(teamId, updateData);

    return NextResponse.json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully'
    });

  } catch (error) {
    console.error('Team PUT API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Team Actions (invite, join, messages, workouts, etc.)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: teamId } = await params;

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

    const body = await request.json();
    const { action } = body;

    const team = await TeamService.getById(teamId);
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    if (action === 'invite') {
      // Invite user to team (trainer only)
      if (!TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can invite members' },
          { status: 403 }
        );
      }

      const { userId } = body;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 }
        );
      }

      const member = await TeamService.invite(teamId, userId, session.user.id);

      return NextResponse.json({
        success: true,
        data: member,
        message: 'User invited successfully'
      });
    }

    if (action === 'invite-email') {
      // Send email invitation (trainer only)
      if (!TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can send invitations' },
          { status: 403 }
        );
      }

      const { email, message } = body;
      if (!email) {
        return NextResponse.json(
          { success: false, error: 'Email address is required' },
          { status: 400 }
        );
      }

      const { TeamInvitationService } = await import('@/services/teams/team_service');
      const result = await TeamInvitationService.sendEmailInvitation({
        teamId,
        invitedBy: session.user.id,
        email,
        message
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to send invitation' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.invite,
        message: 'Invitation sent successfully'
      });
    }

    if (action === 'resend-invite') {
      // Resend email invitation (trainer only)
      if (!TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can resend invitations' },
          { status: 403 }
        );
      }

      const { inviteId } = body;
      if (!inviteId) {
        return NextResponse.json(
          { success: false, error: 'Invite ID is required' },
          { status: 400 }
        );
      }

      const { TeamInvitationService } = await import('@/services/teams/team_service');
      const result = await TeamInvitationService.resendInvitation(inviteId);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to resend invitation' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation resent successfully'
      });
    }

    if (action === 'cancel-invite') {
      // Cancel email invitation (trainer only)
      if (!TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can cancel invitations' },
          { status: 403 }
        );
      }

      const { inviteId } = body;
      if (!inviteId) {
        return NextResponse.json(
          { success: false, error: 'Invite ID is required' },
          { status: 400 }
        );
      }

      const { TeamInvitationService } = await import('@/services/teams/team_service');
      const result = await TeamInvitationService.cancelInvitation(inviteId, session.user.id);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to cancel invitation' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Invitation cancelled successfully'
      });
    }

    if (action === 'accept-application') {
      // Accept team application (trainer only)
      if (!TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can accept applications' },
          { status: 403 }
        );
      }

      const { applicationId } = body;
      if (!applicationId) {
        return NextResponse.json(
          { success: false, error: 'Application ID is required' },
          { status: 400 }
        );
      }

      await TeamService.acceptApplication(applicationId, session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Application accepted successfully'
      });
    }

    if (action === 'reject-application') {
      // Reject team application (trainer only)
      if (!TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can reject applications' },
          { status: 403 }
        );
      }

      const { applicationId, reason } = body;
      if (!applicationId) {
        return NextResponse.json(
          { success: false, error: 'Application ID is required' },
          { status: 400 }
        );
      }

      await TeamService.rejectApplication(applicationId, session.user.id, reason);

      return NextResponse.json({
        success: true,
        message: 'Application rejected successfully'
      });
    }

    if (action === 'leave') {
      // Leave team (members only, not trainer)
      if (TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Team owner cannot leave team. Delete the team instead.' },
          { status: 400 }
        );
      }

      if (!TeamService.isMember(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'You are not a member of this team' },
          { status: 400 }
        );
      }

      await TeamService.leave(teamId, session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Left team successfully'
      });
    }

    if (action === 'remove-member') {
      // Remove member from team (trainer only)
      if (!TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can remove members' },
          { status: 403 }
        );
      }

      const { userId } = body;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'User ID is required' },
          { status: 400 }
        );
      }

      await TeamService.removeMember(teamId, userId);

      return NextResponse.json({
        success: true,
        message: 'Member removed successfully'
      });
    }

    if (action === 'send-message') {
      // Send message to team (members only)
      if (!TeamService.isMember(team, session.user.id) && !TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team members can send messages' },
          { status: 403 }
        );
      }

      const {
        content,
        type = 'TEXT',
        mediaUrl,
        linkedExerciseId,
        linkedWorkoutLogId,
        linkedSocialMediaUrl
      } = body;

      if (!content) {
        return NextResponse.json(
          { success: false, error: 'Message content is required' },
          { status: 400 }
        );
      }

      const message = await TeamService.sendMessage(
        teamId,
        session.user.id,
        content,
        type as TeamMessageType,
        mediaUrl,
        linkedExerciseId,
        linkedWorkoutLogId,
        linkedSocialMediaUrl
      );

      return NextResponse.json({
        success: true,
        data: message,
        message: 'Message sent successfully'
      });
    }

    if (action === 'reply-message') {
      // Reply to team message (members only)
      if (!TeamService.isMember(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team members can reply to messages' },
          { status: 403 }
        );
      }

      const { messageId, content } = body;

      if (!messageId || !content) {
        return NextResponse.json(
          { success: false, error: 'Message ID and content are required' },
          { status: 400 }
        );
      }

      const reply = await TeamService.replyToMessage(messageId, session.user.id, content);

      return NextResponse.json({
        success: true,
        data: reply,
        message: 'Reply sent successfully'
      });
    }

    if (action === 'create-workout') {
      // Create team workout (trainer only)
      if (!TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team owner can create workouts' },
          { status: 403 }
        );
      }

      const { title, description, date, duration, exercises, allowComments, isTemplate } = body;

      if (!title) {
        return NextResponse.json(
          { success: false, error: 'Title is required' },
          { status: 400 }
        );
      }

      // Allow empty exercise array for now (can be added later)
      const exerciseList = exercises && Array.isArray(exercises) ? exercises : [];

      const workout = await TeamService.createWorkout(teamId, session.user.id, {
        title,
        description,
        date: date ? new Date(date) : new Date(),
        duration,
        exercises: exerciseList,
        allowComments: allowComments ?? true,
        isTemplate: isTemplate ?? false
      });

      return NextResponse.json({
        success: true,
        data: workout,
        message: 'Workout created successfully'
      });
    }

    if (action === 'complete-workout') {
      // Complete team workout (members only)
      if (!TeamService.isMember(team, session.user.id) && !TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team members can complete workouts' },
          { status: 403 }
        );
      }

      const { workoutLogId, duration, notes } = body;

      if (!workoutLogId) {
        return NextResponse.json(
          { success: false, error: 'Workout log ID is required' },
          { status: 400 }
        );
      }

      const completion = await TeamService.completeWorkout(workoutLogId, session.user.id, duration, notes);

      return NextResponse.json({
        success: true,
        data: completion,
        message: 'Workout completed successfully'
      });
    }

    if (action === 'comment-workout') {
      // Comment on team workout (members only)
      if (!TeamService.isMember(team, session.user.id) && !TeamService.canManage(team, session.user.id)) {
        return NextResponse.json(
          { success: false, error: 'Only team members can comment on workouts' },
          { status: 403 }
        );
      }

      const { workoutLogId, content } = body;

      if (!workoutLogId || !content) {
        return NextResponse.json(
          { success: false, error: 'Workout log ID and content are required' },
          { status: 400 }
        );
      }

      const comment = await TeamService.commentOnWorkout(workoutLogId, session.user.id, content);

      return NextResponse.json({
        success: true,
        data: comment,
        message: 'Comment added successfully'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Team POST API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Team (Deactivate)
// ============================================================================

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: teamId } = await params;

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

    const team = await TeamService.getById(teamId);
    if (!team) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }

    // Only team owner (trainer) can delete team
    if (!TeamService.canManage(team, session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Only team owner can delete team' },
        { status: 403 }
      );
    }

    await TeamService.delete(teamId);

    return NextResponse.json({
      success: true,
      message: 'Team deleted successfully'
    });

  } catch (error) {
    console.error('Team DELETE API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
