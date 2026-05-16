# ── Stage 1: Build stage ─────────────────────────────────
# Install only production dependencies
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first — Docker layer cache means npm ci only
# re-runs when package.json or package-lock.json changes
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy the rest of the server source code
COPY . .

# ── Stage 2: Production image ─────────────────────────────
# Start fresh — no dev tools, smaller attack surface
FROM node:18-alpine

WORKDIR /app

# Copy the built app from the builder stage
COPY --from=builder /app .

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# The server listens on port 5000 (matches server/index.js)
EXPOSE 5000

# Health check — Azure App Service uses this to know when the container is ready
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the server using Node directly (not nodemon — nodemon is for dev only)
CMD ["node", "index.js"]
