import { Elysia, type Context } from "elysia";
import { auth } from "@/infra/auth/client";
import { createAuthSessionUserMiddleware } from "@/http/middleware/auth-session.middleware";
import {
  createRequireAdminMiddleware,
  createRequireAuthenticatedUserMiddleware,
  getAuthContext,
} from "@/http/middleware/authorization.middleware";

export type { IAuthContext } from "@/http/middleware/auth-session.middleware";
export { getAuthContext };

export function createBetterAuthPlugin() {
  return new Elysia({ name: "better-auth" }).mount(auth.handler);
}

export function createHttpServerClient(): HttpServerClient {
  const app = new Elysia()
    .use(createAuthSessionUserMiddleware())
    .use(createBetterAuthPlugin()) as unknown as Elysia;

  return new HttpServerClient(app);
}

export class HttpServerClient {
  constructor(private readonly app: Elysia) {}

  getApp(): Elysia {
    return this.app;
  }

  createPublicRoute(): Elysia {
    return new Elysia();
  }

  createUserRoute(): Elysia {
    return new Elysia().use(createRequireAuthenticatedUserMiddleware());
  }

  createAdminRoute(): Elysia {
    return new Elysia().use(createRequireAdminMiddleware());
  }
}

export type TAuthRequestContext = Context &
  import("@/http/middleware/auth-session.middleware").IAuthContext;
