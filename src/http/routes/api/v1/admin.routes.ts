import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { getAuthContext } from "@/http/client";
import { PrismaUserRepository } from "@/infra/database/prisma/repositories/prisma-user.repository";
import { PrismaInstagramConnectedAccountRepository } from "@/infra/database/prisma/repositories/prisma-instagram-connected-account.repository";
import { PrismaPublicationRepository } from "@/infra/database/prisma/repositories/prisma-publication.repository";
import { GetAdminDashboardMetricsUseCase } from "@/app/usecases/admin/get-admin-dashboard-metrics.usecase";
import { GetAdminBillingMetricsUseCase } from "@/app/usecases/admin/get-admin-billing-metrics.usecase";
import { ListAdminUsersUseCase } from "@/app/usecases/admin/list-admin-users.usecase";
import { GetAdminUserDetailsUseCase } from "@/app/usecases/admin/get-admin-user-details.usecase";
import { UpdateAdminUserRoleUseCase } from "@/app/usecases/admin/update-admin-user-role.usecase";
import { ListAdminOmegaPayWebhooksUseCase } from "@/app/usecases/admin/list-admin-omegapay-webhooks.usecase";
import { GetAdminOmegaPayWebhookDetailsUseCase } from "@/app/usecases/admin/get-admin-omegapay-webhook-details.usecase";
import { AdminCreditWalletUseCase } from "@/app/usecases/wallet/admin-credit-wallet.usecase";
import { PrismaOmegaPayWebhookRepository } from "@/infra/database/prisma/repositories/prisma-omegapay-webhook.repository";
import { PrismaWalletRepository } from "@/infra/database/prisma/repositories/prisma-wallet.repository";
import { PrismaWalletBillingRepository } from "@/infra/database/prisma/repositories/prisma-wallet-billing.repository";
import { AppRoleEnum } from "@/domain/enums/app-role.enum";
import { OmegaPayWebhookEventEnum } from "@/domain/enums/omegapay.enum";
import { adminBillingMetricsQuerySchema } from "@/http/validation/schemas/admin-billing-metrics.schema";
import { adminCreditWalletBodySchema } from "@/http/validation/schemas/wallet.schema";
import { z } from "zod";

const listUsersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const updateRoleBodySchema = z.object({
  role: z.enum([AppRoleEnum.CLIENT, AppRoleEnum.ADMIN]),
});

const listOmegaPayWebhooksQuerySchema = z.object({
  event: z.nativeEnum(OmegaPayWebhookEventEnum).optional(),
  token: z.string().optional(),
  receivedFrom: z.coerce.date().optional(),
  receivedTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export class AdminRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createAdminRoute();
    const userRepository = new PrismaUserRepository();
    const walletRepository = new PrismaWalletRepository();
    const instagramAccountRepository =
      new PrismaInstagramConnectedAccountRepository();
    const publicationRepository = new PrismaPublicationRepository();

    const getDashboardMetricsUseCase = new GetAdminDashboardMetricsUseCase(
      userRepository,
      instagramAccountRepository,
      publicationRepository,
    );
    const listAdminUsersUseCase = new ListAdminUsersUseCase(
      userRepository,
      walletRepository,
    );
    const getAdminUserDetailsUseCase = new GetAdminUserDetailsUseCase(
      userRepository,
      walletRepository,
    );
    const updateAdminUserRoleUseCase = new UpdateAdminUserRoleUseCase(
      userRepository,
    );
    const omegaPayWebhookRepository = new PrismaOmegaPayWebhookRepository();
    const listAdminOmegaPayWebhooksUseCase = new ListAdminOmegaPayWebhooksUseCase(
      omegaPayWebhookRepository,
    );
    const getAdminOmegaPayWebhookDetailsUseCase =
      new GetAdminOmegaPayWebhookDetailsUseCase(omegaPayWebhookRepository);
    const adminCreditWalletUseCase = new AdminCreditWalletUseCase(walletRepository);
    const getAdminBillingMetricsUseCase = new GetAdminBillingMetricsUseCase(
      new PrismaWalletBillingRepository(),
    );

    route.get("/admin/dashboard/metrics", async () => {
      const metrics = await getDashboardMetricsUseCase.execute();
      return this.successResponse("OK", metrics, 200);
    });

    route.get("/admin/dashboard/billing-metrics", async (context) => {
      const query = adminBillingMetricsQuerySchema.parse(context.query);
      const metrics = await getAdminBillingMetricsUseCase.execute(query);
      return this.successResponse("OK", metrics, 200);
    });

    route.get("/admin/users", async (context) => {
      const query = listUsersQuerySchema.parse(context.query);
      const result = await listAdminUsersUseCase.execute(query);
      return this.successResponse("OK", result, 200);
    });

    route.get("/admin/users/:userId", async (context) => {
      const { userId } = context.params;
      const user = await getAdminUserDetailsUseCase.execute(userId);
      return this.successResponse("OK", user, 200);
    });

    route.patch("/admin/users/:userId/role", async (context) => {
      const { userId } = context.params;
      const { role } = updateRoleBodySchema.parse(context.body);
      const { authUserId } = getAuthContext(context);

      const user = await updateAdminUserRoleUseCase.execute({
        userId,
        role,
        actorUserId: authUserId!,
      });

      return this.successResponse("Papel atualizado", user, 200);
    });

    route.post("/admin/users/:userId/wallet/credit", async (context) => {
      const { userId } = context.params;
      const body = adminCreditWalletBodySchema.parse(context.body);
      const { authUserId } = getAuthContext(context);

      const wallet = await adminCreditWalletUseCase.execute({
        userId,
        amount: body.amount,
        description: body.description,
        actorUserId: authUserId!,
      });

      return this.successResponse("Saldo creditado", wallet, 200);
    });

    route.get("/admin/omegapay/webhooks", async (context) => {
      const query = listOmegaPayWebhooksQuerySchema.parse(context.query);
      const result = await listAdminOmegaPayWebhooksUseCase.execute(query);
      return this.successResponse("OK", result, 200);
    });

    route.get("/admin/omegapay/webhooks/:webhookId", async (context) => {
      const { webhookId } = context.params;
      const webhook = await getAdminOmegaPayWebhookDetailsUseCase.execute(webhookId);
      return this.successResponse("OK", webhook, 200);
    });

    return route;
  }
}
