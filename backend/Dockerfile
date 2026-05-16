# ── Stage 1: Build stage ─────────────────────────────────
# Install only production dependencies in a clean layer
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (layer cache: only re-runs npm ci when package files change)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# ── Stage 2: Production stage (smaller final image) ──────
# Start fresh from a minimal base — no dev tools, no build artifacts
FROM node:18-alpine

WORKDIR /app

# Copy only the built app from the builder stage
COPY --from=builder /app .

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the port the app runs on
EXPOSE 3001

# Health check so Azure App Service knows when the container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Start the application
CMD ["node", "src/index.js"]
