# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm install --workspaces

# Copy source code
COPY . .

# Generate Prisma client
WORKDIR /app/packages/backend
RUN npx prisma generate

# Build backend
RUN npm run build

# Build frontend (optional - don't fail if this fails)
WORKDIR /app/packages/frontend
RUN npm run build || echo "Frontend build skipped or failed"

# Production stage (v3)
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma

# Install production dependencies
RUN npm ci --omit=dev -w @resume-saas/backend 2>&1 || npm install --omit=dev -w @resume-saas/backend

# Copy built backend
COPY --from=builder /app/packages/backend/dist /app/packages/backend/dist

# Generate Prisma Client in production
WORKDIR /app/packages/backend
RUN npx prisma generate

# Environment setup
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})" || exit 1

# Start application
CMD ["npm", "start"]
