FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# ─── Stage 1: instalar dependências ─────────────────────────────────────────
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ─── Stage 2: gerar cliente Prisma ──────────────────────────────────────────
FROM deps AS build
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN bun run prisma:generate

# ─── Stage 3: imagem de produção ────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/generated   ./generated
COPY --from=build /app/prisma      ./prisma
COPY --from=build /app/src         ./src
COPY --from=build /app/package.json ./
COPY --from=build /app/tsconfig.json ./

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- "http://localhost:${PORT:-8080}/api/v1/health" || exit 1

# Roda as migrations e inicia o servidor
CMD ["sh", "-c", "bun run db:migrate:deploy && bun run start"]
