FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy root package files
COPY package*.json ./

# Copy backend package and source
COPY packages/backend ./packages/backend

# Install dependencies
RUN npm install

# Install backend dependencies specifically
WORKDIR /app/packages/backend
RUN npm install

# Build backend
RUN echo "=== Building with tsc ===" && npx tsc -p tsconfig.json 2>&1 || echo "=== Build reported error but continuing ===" 

# Install ts-node for runtime execution (if dist wasn't created)
RUN npm install --save-dev ts-node @types/node

# Generate Prisma Client
RUN npx prisma generate

# Environment setup
ENV NODE_ENV=production

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})" || exit 1

# Start application - try dist/server.js first, fall back to ts-node
CMD if [ -f dist/server.js ]; then node dist/server.js; else npx ts-node src/server.ts; fi
