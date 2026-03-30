FROM node:20-alpine

WORKDIR /app

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
RUN npx tsc -p tsconfig.json

# Verify dist was created before continuing
RUN if [ ! -f dist/server.js ]; then echo "ERROR: Build failed, dist/server.js not created" && ls -la . && exit 1; fi

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
CMD ["node", "dist/server.js"]
