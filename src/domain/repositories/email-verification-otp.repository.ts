export interface IEmailVerificationOtpRecord {
  id: string;
  userId: string;
  hashedOtp: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface IEmailVerificationOtpRepository {
  replaceForUser(
    userId: string,
    hashedOtp: string,
    expiresAt: Date,
  ): Promise<void>;
  findLatestByUserId(userId: string): Promise<IEmailVerificationOtpRecord | null>;
  deleteByUserId(userId: string): Promise<void>;
}
