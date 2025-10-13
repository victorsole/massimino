/**
 * Professional Trainer API - Phase 4 Implementation
 * All professional trainer operations: partnerships, challenges, mentoring, networking, reviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { ProfessionalTrainerService } from '@/services/trainer/professional_service';
import { CreatePartnershipRequest, CreateChallengeRequest, CreateMentorRequest } from '@/types/trainer';
import { isTrainer, isActiveUser } from '@/types/auth';

// ============================================================================
// GET - Professional Data Retrieval
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

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

    if (!isTrainer(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Only trainers can access professional features' },
        { status: 403 }
      );
    }

    const action = searchParams.get('action') || 'dashboard';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const period = searchParams.get('period') || 'month';

    switch (action) {
      case 'dashboard':
        // Get complete professional dashboard data
        const [partnerships, challenges, mentorships, connections, reviews] = await Promise.all([
          ProfessionalTrainerService.getPartnerships(session.user.id),
          ProfessionalTrainerService.getChallenges(session.user.id),
          ProfessionalTrainerService.getMentorships(session.user.id),
          ProfessionalTrainerService.getConnections(session.user.id),
          ProfessionalTrainerService.getReceivedReviews(session.user.id, 1, 5)
        ]);

        const [partnershipAnalytics, challengeMetrics, networkingStats, reviewSummary] = await Promise.all([
          ProfessionalTrainerService.getPartnershipAnalytics(session.user.id, period),
          ProfessionalTrainerService.getChallengeMetrics(session.user.id, period),
          ProfessionalTrainerService.getNetworkingStats(session.user.id),
          ProfessionalTrainerService.getReviewSummary(session.user.id)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            partnerships,
            challenges,
            mentorships,
            connections: connections.slice(0, 5), // Latest 5 connections
            reviews: reviews.reviews,
            analytics: {
              partnerships: partnershipAnalytics,
              challenges: challengeMetrics,
              networking: networkingStats,
              reviews: reviewSummary
            },
            period
          }
        });

      case 'partnerships':
        const partnershipData = await ProfessionalTrainerService.getPartnerships(session.user.id);
        const partnershipStats = await ProfessionalTrainerService.getPartnershipAnalytics(session.user.id, period);

        return NextResponse.json({
          success: true,
          data: {
            partnerships: partnershipData,
            analytics: partnershipStats
          }
        });

      case 'challenges':
        const challengeData = await ProfessionalTrainerService.getChallenges(session.user.id);
        const challengeStats = await ProfessionalTrainerService.getChallengeMetrics(session.user.id, period);

        return NextResponse.json({
          success: true,
          data: {
            challenges: challengeData,
            metrics: challengeStats
          }
        });

      case 'challenge-participants':
        const challengeId = searchParams.get('challengeId');
        if (!challengeId) {
          return NextResponse.json(
            { success: false, error: 'Challenge ID is required' },
            { status: 400 }
          );
        }

        const participants = await ProfessionalTrainerService.getChallengeParticipants(challengeId);

        return NextResponse.json({
          success: true,
          data: { participants }
        });

      case 'mentoring':
        const mentorRequests = await ProfessionalTrainerService.getMentorRequests(session.user.id);
        const mentorshipsData = await ProfessionalTrainerService.getMentorships(session.user.id);
        const menteeshipsData = await ProfessionalTrainerService.getMenteeships(session.user.id);

        return NextResponse.json({
          success: true,
          data: {
            requests: mentorRequests,
            mentorships: mentorshipsData,
            menteeships: menteeshipsData
          }
        });

      case 'find-mentors':
        const specializations = searchParams.get('specializations')?.split(',');
        const experienceYears = searchParams.get('experienceYears') ? parseInt(searchParams.get('experienceYears')!) : undefined;
        const location = searchParams.get('location') ?? undefined;
        const rating = searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined;

        const mentorCriteria: any = {};
        if (specializations) mentorCriteria.specializations = specializations;
        if (experienceYears) mentorCriteria.experienceYears = experienceYears;
        if (location) mentorCriteria.location = location;
        if (rating) mentorCriteria.rating = rating;

        const potentialMentors = await ProfessionalTrainerService.findPotentialMentors(session.user.id, mentorCriteria);

        return NextResponse.json({
          success: true,
          data: { mentors: potentialMentors }
        });

      case 'networking':
        const connectionsData = await ProfessionalTrainerService.getConnections(session.user.id);
        const connectionRequestsData = await ProfessionalTrainerService.getConnectionRequests(session.user.id);
        const networkStats = await ProfessionalTrainerService.getNetworkingStats(session.user.id);
        const recommendedConnections = await ProfessionalTrainerService.getRecommendedConnections(session.user.id);

        return NextResponse.json({
          success: true,
          data: {
            connections: connectionsData,
            requests: connectionRequestsData,
            stats: networkStats,
            recommended: recommendedConnections
          }
        });

      case 'search-trainers':
        const searchName = searchParams.get('name') ?? undefined;
        const searchSpecializations = searchParams.get('specializations')?.split(',');
        const searchLocation = searchParams.get('location') ?? undefined;
        const searchExperience = searchParams.get('experienceYears') ? parseInt(searchParams.get('experienceYears')!) : undefined;
        const searchRating = searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined;
        const searchVerified = searchParams.get('verified') === 'true';

        const searchCriteria: any = { verified: searchVerified };
        if (searchName) searchCriteria.name = searchName;
        if (searchSpecializations) searchCriteria.specializations = searchSpecializations;
        if (searchLocation) searchCriteria.location = searchLocation;
        if (searchExperience) searchCriteria.experienceYears = searchExperience;
        if (searchRating) searchCriteria.rating = searchRating;

        const searchResults = await ProfessionalTrainerService.searchTrainers(searchCriteria);

        return NextResponse.json({
          success: true,
          data: { trainers: searchResults }
        });

      case 'network-messages':
        const { messages, total } = await ProfessionalTrainerService.getNetworkMessages(session.user.id, page, limit);

        return NextResponse.json({
          success: true,
          data: {
            messages,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(total / limit),
              totalItems: total,
              hasNextPage: page < Math.ceil(total / limit),
              hasPreviousPage: page > 1
            }
          }
        });

      case 'reviews':
        const reviewType = searchParams.get('type') || 'received';
        const reviewsData = reviewType === 'given'
          ? await ProfessionalTrainerService.getGivenReviews(session.user.id, page, limit)
          : await ProfessionalTrainerService.getReceivedReviews(session.user.id, page, limit);

        const reviewsSummary = await ProfessionalTrainerService.getReviewSummary(session.user.id);

        return NextResponse.json({
          success: true,
          data: {
            reviews: reviewsData.reviews,
            summary: reviewsSummary,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(reviewsData.total / limit),
              totalItems: reviewsData.total,
              hasNextPage: page < Math.ceil(reviewsData.total / limit),
              hasPreviousPage: page > 1
            }
          }
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Professional Trainer GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Professional Actions and Creation
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

    if (!isTrainer(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Only trainers can perform professional actions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-partnership':
        const { partnerEmail, type, revenueShare, description, terms } = body;

        if (!partnerEmail || !type) {
          return NextResponse.json(
            { success: false, error: 'Partner email and type are required' },
            { status: 400 }
          );
        }

        const partnershipRequest: CreatePartnershipRequest = {
          partnerEmail,
          type,
          revenueShare: revenueShare || 50,
          description,
          terms
        };

        const partnershipValidation = ProfessionalTrainerService.validatePartnership(partnershipRequest);
        if (!partnershipValidation.isValid) {
          return NextResponse.json(
            { success: false, error: partnershipValidation.errors.join(', ') },
            { status: 400 }
          );
        }

        const canPartner = await ProfessionalTrainerService.canBecomePartner(session.user.id, partnerEmail);
        if (!canPartner.canPartner) {
          return NextResponse.json(
            { success: false, error: canPartner.reason },
            { status: 400 }
          );
        }

        const partnership = await ProfessionalTrainerService.createPartnership(session.user.id, partnershipRequest);

        return NextResponse.json({
          success: true,
          data: partnership,
          message: 'Partnership created successfully'
        }, { status: 201 });

      case 'invite-partner':
        const { email, message } = body;

        if (!email) {
          return NextResponse.json(
            { success: false, error: 'Email is required' },
            { status: 400 }
          );
        }

        const invitation = await ProfessionalTrainerService.invitePartner(session.user.id, email, message);

        return NextResponse.json({
          success: true,
          data: invitation,
          message: 'Partnership invitation sent successfully'
        });

      case 'respond-partnership-invite':
        const { invitationId, response, responseMessage } = body;

        if (!invitationId || !response) {
          return NextResponse.json(
            { success: false, error: 'Invitation ID and response are required' },
            { status: 400 }
          );
        }

        await ProfessionalTrainerService.respondToPartnerInvite(invitationId, response, responseMessage);

        return NextResponse.json({
          success: true,
          message: `Partnership invitation ${response.toLowerCase()} successfully`
        });

      case 'create-challenge':
        const { title, description: challengeDesc, type: challengeType, startDate, endDate, maxParticipants, entryFee, prizePool, rules, metrics } = body;

        if (!title || !challengeType || !startDate || !endDate || !rules) {
          return NextResponse.json(
            { success: false, error: 'Title, type, dates, and rules are required' },
            { status: 400 }
          );
        }

        const challengeRequest: CreateChallengeRequest = {
          title,
          description: challengeDesc,
          type: challengeType,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          maxParticipants,
          entryFee,
          prizePool,
          rules,
          metrics: metrics || {}
        };

        const challengeValidation = ProfessionalTrainerService.validateChallenge(challengeRequest);
        if (!challengeValidation.isValid) {
          return NextResponse.json(
            { success: false, error: challengeValidation.errors.join(', ') },
            { status: 400 }
          );
        }

        const canCreate = await ProfessionalTrainerService.canCreateChallenge(session.user.id);
        if (!canCreate.canCreate) {
          return NextResponse.json(
            { success: false, error: canCreate.reason },
            { status: 400 }
          );
        }

        const challenge = await ProfessionalTrainerService.createChallenge(session.user.id, challengeRequest);

        return NextResponse.json({
          success: true,
          data: challenge,
          message: 'Challenge created successfully'
        }, { status: 201 });

      case 'add-challenge-prize':
        const { challengeId, prizeName, prizeDescription, prizeValue, position } = body;

        if (!challengeId || !prizeName || !position) {
          return NextResponse.json(
            { success: false, error: 'Challenge ID, prize name, and position are required' },
            { status: 400 }
          );
        }

        await ProfessionalTrainerService.addChallengePrize(challengeId, {
          name: prizeName,
          description: prizeDescription,
          value: prizeValue || 0,
          position
        });

        return NextResponse.json({
          success: true,
          message: 'Prize added to challenge successfully'
        });

      case 'request-mentor':
        const { mentorId, reason, expectedDuration, goals } = body;

        if (!mentorId || !reason) {
          return NextResponse.json(
            { success: false, error: 'Mentor ID and reason are required' },
            { status: 400 }
          );
        }

        const mentorRequest: CreateMentorRequest = {
          mentorId,
          reason,
          expectedDuration,
          goals: goals || []
        };

        const mentorValidation = ProfessionalTrainerService.validateMentorRequest(mentorRequest);
        if (!mentorValidation.isValid) {
          return NextResponse.json(
            { success: false, error: mentorValidation.errors.join(', ') },
            { status: 400 }
          );
        }

        const canRequest = await ProfessionalTrainerService.canRequestMentor(session.user.id, mentorId);
        if (!canRequest.canRequest) {
          return NextResponse.json(
            { success: false, error: canRequest.reason },
            { status: 400 }
          );
        }

        const mentorship = await ProfessionalTrainerService.requestMentor(session.user.id, mentorId, reason);

        return NextResponse.json({
          success: true,
          data: mentorship,
          message: 'Mentor request sent successfully'
        });

      case 'accept-mentor-request':
        const { requestId, acceptMessage } = body;

        if (!requestId) {
          return NextResponse.json(
            { success: false, error: 'Request ID is required' },
            { status: 400 }
          );
        }

        await ProfessionalTrainerService.acceptMentorRequest(requestId, acceptMessage);

        return NextResponse.json({
          success: true,
          message: 'Mentor request accepted successfully'
        });

      case 'decline-mentor-request':
        const { requestId: declineRequestId, declineReason } = body;

        if (!declineRequestId) {
          return NextResponse.json(
            { success: false, error: 'Request ID is required' },
            { status: 400 }
          );
        }

        await ProfessionalTrainerService.declineMentorRequest(declineRequestId, declineReason);

        return NextResponse.json({
          success: true,
          message: 'Mentor request declined successfully'
        });

      case 'schedule-mentor-session':
        const { relationshipId, sessionTitle, sessionDescription, scheduledAt, duration, isVirtual, meetingLink } = body;

        if (!relationshipId || !sessionTitle || !scheduledAt || !duration) {
          return NextResponse.json(
            { success: false, error: 'Relationship ID, title, scheduled time, and duration are required' },
            { status: 400 }
          );
        }

        const mentorSession = await ProfessionalTrainerService.scheduleMentorSession(relationshipId, {
          title: sessionTitle,
          description: sessionDescription,
          scheduledAt: new Date(scheduledAt),
          duration,
          isVirtual: isVirtual || false,
          meetingLink
        });

        return NextResponse.json({
          success: true,
          data: mentorSession,
          message: 'Mentor session scheduled successfully'
        });

      case 'send-connection-request':
        const { trainerId, connectionMessage } = body;

        if (!trainerId) {
          return NextResponse.json(
            { success: false, error: 'Trainer ID is required' },
            { status: 400 }
          );
        }

        const connection = await ProfessionalTrainerService.sendConnectionRequest(session.user.id, trainerId, connectionMessage);

        return NextResponse.json({
          success: true,
          data: connection,
          message: 'Connection request sent successfully'
        });

      case 'send-network-message':
        const { toTrainerId, subject, networkMessage } = body;

        if (!toTrainerId || !subject || !networkMessage) {
          return NextResponse.json(
            { success: false, error: 'Recipient, subject, and message are required' },
            { status: 400 }
          );
        }

        const messageResult = await ProfessionalTrainerService.sendNetworkMessage(session.user.id, toTrainerId, subject, networkMessage);

        return NextResponse.json({
          success: true,
          data: messageResult,
          message: 'Message sent successfully'
        });

      case 'submit-review':
        const { revieweeId, rating, category, reviewTitle, review, skills, wouldRecommend, isAnonymous } = body;

        if (!revieweeId || !rating || !category || !review) {
          return NextResponse.json(
            { success: false, error: 'Reviewee ID, rating, category, and review are required' },
            { status: 400 }
          );
        }

        const reviewResult = await ProfessionalTrainerService.submitReview(session.user.id, revieweeId, {
          rating,
          category,
          title: reviewTitle,
          review,
          skills: skills || [],
          wouldRecommend: wouldRecommend !== false,
          isAnonymous: isAnonymous || false
        });

        return NextResponse.json({
          success: true,
          data: reviewResult,
          message: 'Review submitted successfully'
        });

      case 'request-review':
        const { revieweeId: requestRevieweeId, requestMessage } = body;

        if (!requestRevieweeId) {
          return NextResponse.json(
            { success: false, error: 'Reviewee ID is required' },
            { status: 400 }
          );
        }

        const reviewRequestResult = await ProfessionalTrainerService.requestReview(session.user.id, requestRevieweeId, requestMessage);

        return NextResponse.json({
          success: true,
          data: reviewRequestResult,
          message: 'Review request sent successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Professional Trainer POST API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not available until database migration')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 503 }
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

// ============================================================================
// PUT - Professional Updates
// ============================================================================

export async function PUT(request: NextRequest) {
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

    if (!isTrainer(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Only trainers can update professional data' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for updates' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update-partnership':
        const { type, revenueShare, description, terms } = body;
        const partnershipUpdates: Partial<CreatePartnershipRequest> = {};

        if (type) partnershipUpdates.type = type;
        if (revenueShare !== undefined) partnershipUpdates.revenueShare = revenueShare;
        if (description) partnershipUpdates.description = description;
        if (terms) partnershipUpdates.terms = terms;

        const updatedPartnership = await ProfessionalTrainerService.updatePartnership(id, partnershipUpdates);

        return NextResponse.json({
          success: true,
          data: updatedPartnership,
          message: 'Partnership updated successfully'
        });

      case 'update-challenge':
        const { title, challengeDescription, maxParticipants, entryFee, prizePool, rules, metrics } = body;
        const challengeUpdates: Partial<CreateChallengeRequest> = {};

        if (title) challengeUpdates.title = title;
        if (challengeDescription) challengeUpdates.description = challengeDescription;
        if (maxParticipants) challengeUpdates.maxParticipants = maxParticipants;
        if (entryFee !== undefined) challengeUpdates.entryFee = entryFee;
        if (prizePool !== undefined) challengeUpdates.prizePool = prizePool;
        if (rules) challengeUpdates.rules = rules;
        if (metrics) challengeUpdates.metrics = metrics;

        const updatedChallenge = await ProfessionalTrainerService.updateChallenge(id, challengeUpdates);

        return NextResponse.json({
          success: true,
          data: updatedChallenge,
          message: 'Challenge updated successfully'
        });

      case 'start-challenge':
        await ProfessionalTrainerService.startChallenge(id);

        return NextResponse.json({
          success: true,
          message: 'Challenge started successfully'
        });

      case 'end-challenge':
        await ProfessionalTrainerService.endChallenge(id);

        return NextResponse.json({
          success: true,
          message: 'Challenge ended successfully'
        });

      case 'accept-connection':
        await ProfessionalTrainerService.acceptConnection(id);

        return NextResponse.json({
          success: true,
          message: 'Connection accepted successfully'
        });

      case 'decline-connection':
        await ProfessionalTrainerService.declineConnection(id);

        return NextResponse.json({
          success: true,
          message: 'Connection declined successfully'
        });

      case 'respond-to-review':
        const { responseText } = body;

        if (!responseText) {
          return NextResponse.json(
            { success: false, error: 'Response text is required' },
            { status: 400 }
          );
        }

        await ProfessionalTrainerService.respondToReview(id, responseText);

        return NextResponse.json({
          success: true,
          message: 'Review response submitted successfully'
        });

      case 'log-mentor-session':
        const { notes, rating } = body;

        if (!notes) {
          return NextResponse.json(
            { success: false, error: 'Session notes are required' },
            { status: 400 }
          );
        }

        await ProfessionalTrainerService.logMentorSession(id, notes, rating);

        return NextResponse.json({
          success: true,
          message: 'Mentor session logged successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Professional Trainer PUT API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Professional Deletion
// ============================================================================

export async function DELETE(request: NextRequest) {
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

    if (!isTrainer(session.user as any)) {
      return NextResponse.json(
        { success: false, error: 'Only trainers can delete professional data' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required for deletion' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'end-partnership':
        const reason = searchParams.get('reason');
        await ProfessionalTrainerService.endPartnership(id, reason ?? undefined);

        return NextResponse.json({
          success: true,
          message: 'Partnership ended successfully'
        });

      case 'delete-challenge':
        await ProfessionalTrainerService.deleteChallenge(id);

        return NextResponse.json({
          success: true,
          message: 'Challenge deleted successfully'
        });

      case 'end-mentorship':
        const mentorshipReason = searchParams.get('reason');
        await ProfessionalTrainerService.endMentorship(id, mentorshipReason ?? undefined);

        return NextResponse.json({
          success: true,
          message: 'Mentorship ended successfully'
        });

      case 'remove-connection':
        await ProfessionalTrainerService.removeConnection(id);

        return NextResponse.json({
          success: true,
          message: 'Connection removed successfully'
        });

      case 'flag-review':
        const flagReason = searchParams.get('reason');
        if (!flagReason) {
          return NextResponse.json(
            { success: false, error: 'Reason is required for flagging' },
            { status: 400 }
          );
        }

        await ProfessionalTrainerService.flagReview(id, flagReason);

        return NextResponse.json({
          success: true,
          message: 'Review flagged successfully'
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Professional Trainer DELETE API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}