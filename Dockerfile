FROM node:20-alpine

WORKDIR /app

# Copy all package files  
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/backend/prisma ./packages/backend/prisma
COPY packages/backend/src ./packages/backend/src
COPY packages/backend/tsconfig.json ./packages/backend/tsconfig.json

# Install ALL dependencies (including dev for TypeScript build)
RUN npm install --workspaces

# Build backend
WORKDIR /app/packages/backend
RUN npm run build

# Generate Prisma Client
RUN npx prisma generate

# Environment setup
ENV NODE_ENV=production
WORKDIR /app/packages/backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})" || exit 1

# Start application directly with node (bypass npm to avoid script lookup)
CMD ["node", "/app/packages/backend/dist/server.js"]
