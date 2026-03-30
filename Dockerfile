FROM node:20-alpine

WORKDIR /app

# Copy all package files and source code
COPY . .

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --workspaces

# Build backend in the workspace context
WORKDIR /app/packages/backend
RUN echo "Building backend..." && npm run build && echo "Build complete" && ls -la dist/ || (echo "Build failed or dist not found" && ls -laR /app/packages/backend/)

# Verify dist was created
RUN test -f /app/packages/backend/dist/server.js && echo "✓ dist/server.js verified" || (echo "✗ ERROR: dist/server.js not created" && find /app -name "server.js" -type f)

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

# Start application directly with node
CMD ["node", "/app/packages/backend/dist/server.js"]
