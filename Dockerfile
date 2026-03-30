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

# Production stage (v2)
FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma

# Install production dependencies ONLY
RUN npm ci --omit=dev --workspaces 2>&1 || npm install --omit=dev --workspaces

# Generate Prisma Client
WORKDIR /app/packages/backend
RUN npx prisma generate

# Copy built backend artifacts from builder stage
COPY --from=builder /app/packages/backend/dist /app/packages/backend/dist

# Copy built frontend artifacts from builder stage  
COPY --from=builder /app/packages/frontend/dist /app/packages/frontend/dist

# Set production environment
ENV NODE_ENV=production
WORKDIR /app/packages/backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})" || exit 1

# Start backend server
CMD ["npm", "start"]
