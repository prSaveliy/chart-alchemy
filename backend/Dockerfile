FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

# Copy the root dependency files
COPY package.json package-lock.json ./

# Copy workspace configurations
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install only the backend workspace's deps
RUN npm ci --workspace=@chart-alchemy/backend

# Copy the rest of the backend code
COPY backend/ ./backend/

# Generate Prisma Client
RUN cd backend && npx prisma generate

# Build the backend application
COPY backend/src ./backend/src
RUN npm run build -w @chart-alchemy/backend \
 && cp -r backend/src/prompts backend/dist/prompts


FROM node:22-slim AS installer

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl dumb-init \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install only the backend workspace's production deps
RUN npm ci --omit=dev --workspace=@chart-alchemy/backend

# Regenerate the Prisma Client 
COPY backend/prisma ./backend/prisma
COPY backend/prisma.config.ts ./backend/prisma.config.ts
RUN cd backend && npx prisma generate


FROM node:22-slim AS runner

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl dumb-init \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Copy files from previous stages and change ownership to the 'node' user
COPY --chown=node:node --from=installer /app/node_modules ./node_modules
COPY --chown=node:node --from=installer /app/package.json ./package.json
COPY --chown=node:node --from=installer /app/backend ./backend
COPY --chown=node:node --from=builder /app/backend/dist ./backend/dist

# Entrypoint materializes $GCP_KEY_JSON to a file for Vertex AI auth
COPY --chown=root:root backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

USER node

WORKDIR /app/backend

ENTRYPOINT ["dumb-init", "--", "/usr/local/bin/docker-entrypoint.sh"]

CMD ["npm", "run", "docker:start"]
