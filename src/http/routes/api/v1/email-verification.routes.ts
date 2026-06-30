import { getAuthContext } from "@/http/client";
import { BaseHttpRoute, type THttpRoute } from "@/http/routes/base-http-route";
import { SendEmailVerificationOtpUseCase } from "@/app/usecases/email-verification/send-email-verification-otp.usecase";
import { VerifyEmailVerificationOtpUseCase } from "@/app/usecases/email-verification/verify-email-verification-otp.usecase";
import { PrismaUserRepository } from "@/infra/database/prisma/repositories/prisma-user.repository";
import { PrismaEmailVerificationOtpRepository } from "@/infra/database/prisma/repositories/prisma-email-verification-otp.repository";
import { NodemailerMailService } from "@/infra/smtp/nodemailer-mail.service";
import { verifyEmailVerificationOtpBodySchema } from "@/http/validation/schemas/email-verification.schema";

export class EmailVerificationRoutes extends BaseHttpRoute {
  build(): THttpRoute {
    const route = this.serverClient.createUserRoute();
    const userRepository = new PrismaUserRepository();
    const emailVerificationOtpRepository =
      new PrismaEmailVerificationOtpRepository();
    const emailService = new NodemailerMailService();

    const sendEmailVerificationOtpUseCase = new SendEmailVerificationOtpUseCase(
      userRepository,
      emailVerificationOtpRepository,
      emailService,
    );
    const verifyEmailVerificationOtpUseCase =
      new VerifyEmailVerificationOtpUseCase(
        userRepository,
        emailVerificationOtpRepository,
      );

    route.post("/email-verification/send-otp", async (context) => {
      const { authUserId } = getAuthContext(context);
      const result = await sendEmailVerificationOtpUseCase.execute(authUserId!);
      return this.successResponse("Código enviado", result, 200);
    });

    route.post("/email-verification/verify-otp", async (context) => {
      const { authUserId } = getAuthContext(context);
      const body = verifyEmailVerificationOtpBodySchema.parse(context.body);
      const user = await verifyEmailVerificationOtpUseCase.execute(
        authUserId!,
        body.otp,
      );

      return this.successResponse("E-mail confirmado", user, 200);
    });

    return route;
  }
}
