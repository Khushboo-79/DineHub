# Multi-stage production build for API Gateway
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps

COPY apps/api-gateway ./apps/api-gateway
COPY libs ./libs

RUN npx nest build api-gateway

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force

COPY --from=builder /usr/src/app/dist/apps/api-gateway ./dist/apps/api-gateway

EXPOSE 4000

CMD ["node", "dist/apps/api-gateway/main.js"]
