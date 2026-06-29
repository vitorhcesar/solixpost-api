import { z } from "zod";

export const createWalletPixRechargeBodySchema = z.object({
  amount: z.coerce.number().positive(),
  client: z.object({
    phone: z.string().min(8),
    document: z.string().min(11),
  }),
});

export type TCreateWalletPixRechargeBody = z.infer<
  typeof createWalletPixRechargeBodySchema
>;

export const adminCreditWalletBodySchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().max(255).optional(),
});

export type TAdminCreditWalletBody = z.infer<typeof adminCreditWalletBodySchema>;
