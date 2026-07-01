import { z } from "zod";

export const deleteUserAccountBodySchema = z.object({
  confirmation: z.literal("DELETE", {
    errorMap: () => ({
      message: 'Digite "DELETE" para confirmar a exclusão da conta',
    }),
  }),
});

export type TDeleteUserAccountBody = z.infer<typeof deleteUserAccountBodySchema>;
