import type { Elysia } from "elysia";
import { AppError } from "@/http/services/app/errors/app.error";

export function registerGlobalApiErrorHandler(app: Elysia): void {
  app.onError(({ error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode;

      return {
        status: error.statusCode,
        message: error.message,
        code: error.code,
        error: error.data,
      };
    }

    console.error("API_ERROR_LOG", error);

    set.status = 500;

    return {
      status: 500,
      message: "Erro interno do servidor",
      code: "internal_server_error",
    };
  });
}
