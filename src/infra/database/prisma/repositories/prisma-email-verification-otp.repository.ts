import { BasePrismaRepository } from "@/infra/database/prisma/repositories/base-prisma.repository";
import type {
  IEmailVerificationOtpRecord,
  IEmailVerificationOtpRepository,
} from "@/domain/repositories/email-verification-otp.repository";

const EMAIL_VERIFICATION_OTP_PREFIX = "email-verification-otp:";

export class PrismaEmailVerificationOtpRepository
  extends BasePrismaRepository
  implements IEmailVerificationOtpRepository
{
  async replaceForUser(
    userId: string,
    hashedOtp: string,
    expiresAt: Date,
  ): Promise<void> {
    const prisma = this.getPrismaClient();
    const identifier = this.buildIdentifier(userId);

    await prisma.verification.deleteMany({
      where: { identifier },
    });

    await prisma.verification.create({
      data: {
        id: crypto.randomUUID(),
        identifier,
        value: hashedOtp,
        expiresAt,
      },
    });
  }

  async findLatestByUserId(
    userId: string,
  ): Promise<IEmailVerificationOtpRecord | null> {
    const row = await this.getPrismaClient().verification.findFirst({
      where: { identifier: this.buildIdentifier(userId) },
      orderBy: { createdAt: "desc" },
    });

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      userId,
      hashedOtp: row.value,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
    };
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.getPrismaClient().verification.deleteMany({
      where: { identifier: this.buildIdentifier(userId) },
    });
  }

  private buildIdentifier(userId: string): string {
    return `${EMAIL_VERIFICATION_OTP_PREFIX}${userId}`;
  }
}
