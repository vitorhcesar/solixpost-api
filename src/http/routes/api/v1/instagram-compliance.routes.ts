import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { HandleInstagramMetaComplianceUseCase } from "@/app/usecases/instagram/handle-instagram-meta-compliance.usecase";
import { PrismaInstagramConnectedAccountRepository } from "@/infra/database/prisma/repositories/prisma-instagram-connected-account.repository";
import { PrismaAccountSlotRepository } from "@/infra/database/prisma/repositories/prisma-account-slot.repository";
import { EnvService } from "@/http/services/env/env.service";
import { parseMetaSignedRequest } from "@/infra/meta/parse-meta-signed-request.util";

async function extractSignedRequest(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);

    return params.get("signed_request");
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    return formData.get("signed_request")?.toString() ?? null;
  }

  return null;
}

export class InstagramComplianceRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createPublicRoute();
    const env = EnvService.getInstance();

    const handleInstagramMetaComplianceUseCase =
      new HandleInstagramMetaComplianceUseCase(
        new PrismaInstagramConnectedAccountRepository(),
        new PrismaAccountSlotRepository(),
        env.corsOrigin,
      );

    route.post("/instagram/deauthorize", async (context) => {
      const signedRequest = await extractSignedRequest(context.request);

      if (!signedRequest) {
        return new Response("Missing signed_request", { status: 400 });
      }

      const payload = parseMetaSignedRequest(
        signedRequest,
        env.instagramAppSecret,
      );

      if (!payload) {
        return new Response("Invalid signed_request", { status: 403 });
      }

      await handleInstagramMetaComplianceUseCase.deauthorizeByInstagramUserId(
        payload.user_id,
      );

      return new Response("OK", { status: 200 });
    });

    route.post("/instagram/data-deletion", async (context) => {
      const signedRequest = await extractSignedRequest(context.request);

      if (!signedRequest) {
        return new Response("Missing signed_request", { status: 400 });
      }

      const payload = parseMetaSignedRequest(
        signedRequest,
        env.instagramAppSecret,
      );

      if (!payload) {
        return new Response("Invalid signed_request", { status: 403 });
      }

      const result =
        await handleInstagramMetaComplianceUseCase.dataDeletionByInstagramUserId(
          payload.user_id,
        );

      return Response.json({
        url: result.statusUrl,
        confirmation_code: result.confirmationCode,
      });
    });

    return route;
  }
}
