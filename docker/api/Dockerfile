FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl && corepack enable && corepack prepare pnpm@10.12.1 --activate

COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY prisma/schema.prisma prisma/schema.prisma

RUN pnpm install

COPY . .

EXPOSE 4000
