# ── Stage 1: Build the React application ─────────────────
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Pass the backend API URL as a build-time argument
# This gets baked into the static JS bundle at build time
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Build the production React bundle
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────
# Nginx is a lightweight, high-performance web server — perfect for static files
FROM nginx:alpine

# Copy the built React app into Nginx's web root
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx config (required to support React Router client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
