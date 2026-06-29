import { z } from "zod";

const dateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const adminBillingMetricsQuerySchema = z.object({
  from: dateOnlySchema,
  to: dateOnlySchema,
});

export type TAdminBillingMetricsQuery = z.infer<typeof adminBillingMetricsQuerySchema>;
