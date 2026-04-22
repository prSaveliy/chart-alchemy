FROM node:22-slim AS builder

WORKDIR /app

# Copy the root dependency files
COPY package.json package-lock.json ./

# Copy workspace configurations
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install dependencies
RUN npm ci

# Copy the rest of the frontend code
COPY frontend ./frontend

# Set build arguments and environment variables
ARG VITE_SERVER_URL=http://localhost:3000
ARG VITE_API_URL=http://localhost:5173
ENV VITE_SERVER_URL=${VITE_SERVER_URL}
ENV VITE_API_URL=${VITE_API_URL}

# Build the frontend application
RUN npm run build -w @chart-alchemy/frontend


FROM nginx:1.29-alpine AS runtime

# Copy the built static files from the builder stage
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
