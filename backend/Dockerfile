# Base image
FROM node:20-alpine AS build

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Build the specified microservice using the ARG
ARG SERVICE_NAME
RUN npx nest build ${SERVICE_NAME}

# Production image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built assets from the build stage
ARG SERVICE_NAME
COPY --from=build /usr/src/app/dist/apps/${SERVICE_NAME} ./dist
COPY --from=build /usr/src/app/node_modules/@prisma ./node_modules/@prisma

CMD ["node", "dist/main.js"]
