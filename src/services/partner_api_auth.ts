import PartnershipsService from '@/services/partnerships_service';
import { prisma } from '@/core/database';

export async function verifyGymApiKey(apiKey?: string | null) {
  if (!apiKey) return null;
  const hash = PartnershipsService.hashApiKey(apiKey);
  const integ = await prisma.gym_integrations.findFirst({ where: { apiKeyHash: hash, status: 'ACTIVE' as any } });
  if (!integ) return null;
  return integ;
}

