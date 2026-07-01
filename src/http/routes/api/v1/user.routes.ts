import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { GetAuthenticatedUserUseCase } from "@/app/usecases/user/get-authenticated-user.usecase";
import { DeleteUserAccountUseCase } from "@/app/usecases/user/delete-user-account.usecase";
import { PrismaUserRepository } from "@/infra/database/prisma/repositories/prisma-user.repository";
import { getAuthContext } from "@/http/client";
import { deleteUserAccountBodySchema } from "@/http/validation/schemas/user.schema";
import { AppError } from "@/http/services/app/errors/app.error";

export class UserRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createUserRoute();
    const userRepository = new PrismaUserRepository();
    const getAuthenticatedUserUseCase = new GetAuthenticatedUserUseCase(
      userRepository,
    );
    const deleteUserAccountUseCase = new DeleteUserAccountUseCase(
      userRepository,
    );

    route.get("/me", async (context) => {
      const { authUserId } = getAuthContext(context);
      const user = await getAuthenticatedUserUseCase.execute(authUserId!);
      return this.successResponse("OK", user, 200);
    });

    route.post("/me/delete-account", async (context) => {
      const { authUserId } = getAuthContext(context);
      const parsedBody = deleteUserAccountBodySchema.safeParse(context.body);

      if (!parsedBody.success) {
        throw new AppError("Confirmação inválida", 400, "validation", {
          issues: parsedBody.error.flatten(),
        });
      }

      await deleteUserAccountUseCase.execute(authUserId!);

      return this.successResponse("Conta excluída com sucesso", null, 200);
    });

    return route;
  }
}
