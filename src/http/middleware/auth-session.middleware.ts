import { Elysia } from "elysia";
import { auth } from "@/infra/auth/client";
import { AppRoleEnum } from "@/domain/enums/app-role.enum";

export interface IAuthContext {
  authUserId: string | null;
  authUserRole: AppRoleEnum | null;
}

export function createAuthSessionUserMiddleware() {
  return new Elysia({ name: "auth-session" }).derive(
    { as: "global" },
    async ({ request }) => {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        return {
          authUserId: null,
          authUserRole: null,
        } satisfies IAuthContext;
      }

      const role =
        session.user.role === AppRoleEnum.ADMIN
          ? AppRoleEnum.ADMIN
          : AppRoleEnum.USER;

      return {
        authUserId: session.user.id,
        authUserRole: role,
      } satisfies IAuthContext;
    },
  );
}
