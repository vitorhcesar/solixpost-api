import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { GetAuthenticatedUserUseCase } from "@/app/usecases/user/get-authenticated-user.usecase";
import { PrismaUserRepository } from "@/infra/database/prisma/repositories/prisma-user.repository";
import { getAuthContext } from "@/http/client";

export class UserRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createUserRoute();
    const userRepository = new PrismaUserRepository();
    const getAuthenticatedUserUseCase = new GetAuthenticatedUserUseCase(
      userRepository,
    );

    route.get("/me", async (context) => {
      const { authUserId } = getAuthContext(context);
      const user = await getAuthenticatedUserUseCase.execute(authUserId!);
      return this.successResponse("OK", user, 200);
    });

    return route;
  }
}
