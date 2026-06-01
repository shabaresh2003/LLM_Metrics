# Stage 1: Build environment
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package description and lock files
COPY package*.json ./

# Install all dependencies including devDependencies for the build
RUN npm ci

# Copy the rest of the project source files
COPY . .

# Build the project targeting Node
ENV DEPLOY_TARGET=node
RUN npm run build

# Stage 2: Production runner environment
FROM node:22-alpine AS runner

WORKDIR /app

# Set node environment to production
ENV NODE_ENV=production
ENV PORT=3000

# Copy runtime assets and server code from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server-prod.js ./server-prod.js
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Expose the application port
EXPOSE 3000

# Start the node server
CMD ["node", "server-prod.js"]
