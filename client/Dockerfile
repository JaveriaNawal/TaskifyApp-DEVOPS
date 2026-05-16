# ── Stage 1: Build the React + Vite application ──────────
# Uses node:18-alpine for a small, secure build environment
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first — Docker layer cache means npm ci only
# re-runs when package.json / package-lock.json actually change
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# VITE_APP_BASE_URL is passed in at docker build time via --build-arg
# It gets baked into the static JS bundle by Vite at build time.
# In apiSlice.js this is read as: import.meta.env.VITE_APP_BASE_URL
ARG VITE_APP_BASE_URL
ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL

# Build the production bundle — Vite outputs to /app/dist (NOT /app/build)
RUN npm run build

# ── Stage 2: Serve the static bundle with Nginx ───────────
# nginx:alpine is ~25MB — much smaller than a Node image
FROM nginx:alpine

# Copy the Vite dist output into Nginx's web root
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom Nginx config (handles SPA routing for React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
