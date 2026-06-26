import { z } from "zod";
import {
  PublicationDestinationScopeEnum,
  PublicationTypeEnum,
} from "@/domain/enums/instagram.enum";

export const createPublicationBodySchema = z
  .object({
    type: z.nativeEnum(PublicationTypeEnum),
    destinationScope: z.nativeEnum(PublicationDestinationScopeEnum),
    caption: z.string().max(2200).optional().nullable(),
    mediaUrl: z.string().url(),
    instagramConnectedAccountIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((data, context) => {
    if (
      data.destinationScope === PublicationDestinationScopeEnum.SELECTED &&
      (!data.instagramConnectedAccountIds ||
        data.instagramConnectedAccountIds.length === 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "instagramConnectedAccountIds é obrigatório quando destinationScope é selected",
        path: ["instagramConnectedAccountIds"],
      });
    }
  });

export type TCreatePublicationBody = z.infer<typeof createPublicationBodySchema>;

export const instagramConnectCallbackQuerySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
});

export type TInstagramConnectCallbackQuery = z.infer<
  typeof instagramConnectCallbackQuerySchema
>;
