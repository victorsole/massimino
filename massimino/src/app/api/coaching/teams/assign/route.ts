import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { addAthleteToTeam, removeAthleteFromTeam, getTrainerTeamsWithAthletes, getAthletesNotInTeam } from '@/services/coaching/team-assignment';

// GET: Get trainer's teams with athletes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can access this endpoint' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (teamId) {
      // Get athletes not in specific team
      const athletes = await getAthletesNotInTeam(teamId, session.user.id);
      return NextResponse.json({ athletes });
    }

    // Get all teams with athletes
    const teams = await getTrainerTeamsWithAthletes(session.user.id);
    return NextResponse.json({ teams });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST: Add athlete to team
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can assign athletes to teams' }, { status: 403 });
    }

    const body = await request.json();
    const { teamId, athleteId, role } = body;

    if (!teamId || !athleteId) {
      return NextResponse.json({ error: 'teamId and athleteId are required' }, { status: 400 });
    }

    const teamMember = await addAthleteToTeam(teamId, athleteId, session.user.id);

    return NextResponse.json(teamMember, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning athlete to team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign athlete to team' },
      { status: 400 }
    );
  }
}

// DELETE: Remove athlete from team
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'TRAINER') {
      return NextResponse.json({ error: 'Only trainers can remove athletes from teams' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    const athleteId = searchParams.get('athleteId');

    if (!teamId || !athleteId) {
      return NextResponse.json({ error: 'teamId and athleteId are required' }, { status: 400 });
    }

    await removeAthleteFromTeam(teamId, athleteId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error removing athlete from team:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove athlete from team' },
      { status: 400 }
    );
  }
}
