import { Elysia } from "elysia";
import { MinioTemporaryPublicationMediaStorage } from "@/infra/object-storage/minio-temporary-publication-media.storage";
import { AppError } from "@/http/services/app/errors/app.error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildPublicObjectRoutes(): any {
  const storage = new MinioTemporaryPublicationMediaStorage();

  return new Elysia().get(
    "/public/objects/*",
    async (context) => {
      const objectKey = (context.params as Record<string, string>)["*"];

      if (!objectKey || !objectKey.startsWith("temp/")) {
        throw new AppError("Objeto não encontrado", 404, "object_not_found");
      }

      try {
        const { stream, contentType, size } = await storage.getStream(objectKey);

        return new Response(stream as unknown as ReadableStream, {
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(size),
            "Cache-Control": "private, no-store",
          },
        });
      } catch {
        throw new AppError("Objeto não encontrado", 404, "object_not_found");
      }
    },
  );
}
