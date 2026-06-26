import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";

export class HealthRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createPublicRoute();

    route.get("/health", () => {
      return this.successResponse("OK", { status: "healthy" }, 200);
    });

    return route;
  }
}
