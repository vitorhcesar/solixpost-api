import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  CORS_ORIGIN: z.string().min(1),
  INSTAGRAM_APP_ID: z.string().min(1).optional(),
  INSTAGRAM_APP_SECRET: z.string().min(1).optional(),
  INSTAGRAM_REDIRECT_URI: z.string().url().optional(),
  INSTAGRAM_OAUTH_SCOPES: z
    .string()
    .min(1)
    .default("instagram_business_basic,instagram_business_content_publish"),
  INSTAGRAM_TOKEN_ENCRYPTION_KEY: z.string().min(32).optional(),
});

export type TEnv = z.infer<typeof envSchema>;

export class EnvService {
  private static instance: EnvService | null = null;
  private readonly env: TEnv;

  private constructor() {
    this.env = envSchema.parse({
      ...process.env,
      INSTAGRAM_OAUTH_SCOPES:
        process.env.INSTAGRAM_OAUTH_SCOPES ??
        "instagram_business_basic,instagram_business_content_publish",
    });
  }

  static getInstance(): EnvService {
    if (!EnvService.instance) {
      EnvService.instance = new EnvService();
    }

    return EnvService.instance;
  }

  get nodeEnv(): TEnv["NODE_ENV"] {
    return this.env.NODE_ENV;
  }

  get port(): number {
    return this.env.PORT;
  }

  get databaseUrl(): string {
    return this.env.DATABASE_URL;
  }

  get betterAuthSecret(): string {
    return this.env.BETTER_AUTH_SECRET;
  }

  get betterAuthUrl(): string {
    return this.env.BETTER_AUTH_URL;
  }

  get corsOrigin(): string {
    return this.env.CORS_ORIGIN;
  }

  get instagramAppId(): string {
    if (!this.env.INSTAGRAM_APP_ID) {
      throw new Error("INSTAGRAM_APP_ID não configurado");
    }

    return this.env.INSTAGRAM_APP_ID;
  }

  get instagramAppSecret(): string {
    if (!this.env.INSTAGRAM_APP_SECRET) {
      throw new Error("INSTAGRAM_APP_SECRET não configurado");
    }

    return this.env.INSTAGRAM_APP_SECRET;
  }

  get instagramRedirectUri(): string {
    if (!this.env.INSTAGRAM_REDIRECT_URI) {
      throw new Error("INSTAGRAM_REDIRECT_URI não configurado");
    }

    return this.env.INSTAGRAM_REDIRECT_URI;
  }

  get instagramOAuthScopes(): string {
    return this.env.INSTAGRAM_OAUTH_SCOPES;
  }

  get instagramTokenEncryptionKey(): string {
    return this.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY ?? this.env.BETTER_AUTH_SECRET;
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === "development";
  }
}
