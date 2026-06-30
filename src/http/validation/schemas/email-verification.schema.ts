import { z } from "zod";

export const verifyEmailVerificationOtpBodySchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "O código deve conter 6 dígitos"),
});
