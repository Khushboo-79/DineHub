# Multi-stage production build for Core Monolith
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma ./prisma/

RUN npm ci --legacy-peer-deps
RUN npx prisma generate

COPY apps/monolith ./apps/monolith
COPY libs ./libs

RUN npx nest build monolith

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production --legacy-peer-deps && npm cache clean --force
RUN npx prisma generate

COPY --from=builder /usr/src/app/dist/apps/monolith ./dist/apps/monolith

EXPOSE 3000

CMD ["node", "dist/apps/monolith/main.js"]
