FROM node:20-alpine

WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/tsconfig.json ./packages/backend/tsconfig.json

# Install dependencies
RUN npm ci --omit=dev -w @resume-saas/backend

# Build backend in production
WORKDIR /app/packages/backend
RUN npx tsc -p tsconfig.json

# Generate Prisma Client
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
