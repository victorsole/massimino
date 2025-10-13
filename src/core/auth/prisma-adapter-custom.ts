// src/core/auth/prisma-adapter-custom.ts

// Custom Prisma Adapter for lowercase model names
// This adapter wraps the standard PrismaAdapter but uses lowercase table names

import type { Adapter } from "next-auth/adapters"
import type { AdapterUser, AdapterAccount } from "next-auth/adapters"
import { PrismaClient } from "@prisma/client"

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      const data = {
        id: crypto.randomUUID(),
        email: user.email!,
        emailVerified: user.emailVerified ?? null,
        name: user.name ?? null,
        image: user.image ?? null,
        updatedAt: new Date(),
        createdAt: new Date(),
      };
      return await prisma.users.create({ data }) as any;
    },
    async getUser(id) {
      return await prisma.users.findUnique({ where: { id } }) as any;
    },
    async getUserByEmail(email) {
      return await prisma.users.findUnique({ where: { email } }) as any;
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.accounts.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { users: true },
      });
      return account?.users as any ?? null;
    },
    async updateUser({ id, ...data }) {
      return await prisma.users.update({ where: { id }, data }) as any;
    },
    async deleteUser(userId) {
      await prisma.users.delete({ where: { id: userId } });
    },
    async linkAccount(account: AdapterAccount) {
      await prisma.accounts.create({
        data: {
          id: crypto.randomUUID(),
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: account.session_state ?? null,
        },
      });
    },
    async unlinkAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      await prisma.accounts.delete({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
      });
    },
    async createSession({ sessionToken, userId, expires }) {
      return await prisma.sessions.create({
        data: {
          id: crypto.randomUUID(),
          sessionToken,
          userId,
          expires,
        },
      }) as any;
    },
    async getSessionAndUser(sessionToken) {
      const userAndSession = await prisma.sessions.findUnique({
        where: { sessionToken },
        include: { users: true },
      });
      if (!userAndSession) return null;
      const { users: user, ...session } = userAndSession;
      return { user: user as any, session: session as any };
    },
    async updateSession({ sessionToken, ...data }) {
      return await prisma.sessions.update({
        where: { sessionToken },
        data,
      }) as any;
    },
    async deleteSession(sessionToken) {
      await prisma.sessions.delete({ where: { sessionToken } });
    },
    async createVerificationToken({ identifier, expires, token }) {
      return await prisma.verificationtokens.create({
        data: { identifier, expires, token },
      }) as any;
    },
    async useVerificationToken({ identifier, token }) {
      try {
        return await prisma.verificationtokens.delete({
          where: { identifier_token: { identifier, token } },
        }) as any;
      } catch (error) {
        return null;
      }
    },
  };
}
