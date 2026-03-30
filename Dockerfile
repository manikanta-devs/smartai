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

# Build frontend
WORKDIR /app/packages/frontend
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma

RUN npm ci --omit=dev --workspaces

# Generate Prisma client in production stage
WORKDIR /app/packages/backend
RUN npx prisma generate

# Copy built backend
COPY --from=builder /app/packages/backend/dist ./dist

# Set environment
ENV NODE_ENV=production
WORKDIR /app/packages/backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})"

# Start application
CMD ["npm", "start"]
