FROM node:20-alpine

WORKDIR /app

# Copy all package files and source code
COPY . .

# Install ALL dependencies (including dev dependencies for build)
RUN npm install --workspaces

# Build ALL workspaces (this builds shared first, then dependencies)
RUN echo "Building all packages..." && npm run build -ws && echo "✓ Build complete"

# Verify dist was created
RUN test -f /app/packages/backend/dist/server.js && echo "✓ dist/server.js verified" || (echo "✗ ERROR: dist/server.js not found" && find /app -name "server.js" -type f 2>/dev/null || echo "No server.js found anywhere")

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
