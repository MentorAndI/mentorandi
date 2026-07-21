import { getPrismaClient } from "@/lib/prisma";

export class AlphaInviteRepository {
  private readonly prisma = getPrismaClient();

  create(input: {
    codeHash: string;
    codePreview: string;
    email: string | null;
    expiresAt: Date | null;
    maxUses: number;
    note: string | null;
  }) {
    return this.prisma.alphaInvite.create({ data: input });
  }

  findByCodeHash(codeHash: string) {
    return this.prisma.alphaInvite.findUnique({ where: { codeHash } });
  }

  listRecent(limit: number) {
    return this.prisma.alphaInvite.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async consume(input: {
    inviteId: string;
    previousUseCount: number;
    usedByUserId: string;
  }) {
    const now = new Date();
    const result = await this.prisma.alphaInvite.updateMany({
      data: {
        useCount: { increment: 1 },
        usedAt: now,
        usedByUserId: input.usedByUserId,
      },
      where: {
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        id: input.inviteId,
        revokedAt: null,
        useCount: input.previousUseCount,
      },
    });

    return result.count === 1;
  }

  async revoke(inviteId: string) {
    const result = await this.prisma.alphaInvite.updateMany({
      data: { revokedAt: new Date() },
      where: { id: inviteId, revokedAt: null },
    });

    return result.count === 1;
  }
}
