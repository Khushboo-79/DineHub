# Multi-stage production build for Auth Microservice
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps
RUN npx prisma generate

COPY apps/auth-service ./apps/auth-service
COPY libs ./libs

RUN npx nest build auth-service

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /usr/src/app/dist/apps/auth-service ./dist/apps/auth-service

EXPOSE 3002

CMD ["node", "dist/apps/auth-service/main.js"]
