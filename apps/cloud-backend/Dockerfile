# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY prisma ./prisma
RUN npx --no-install prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npx --no-install tsc --project tsconfig.json

# Stage 2: Production
FROM node:20-alpine AS production
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat curl postgresql-client
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN npm config set fetch-retry-maxtimeout 600000 && \
    npm config set fetch-retry-mintimeout 100000 && \
    npm config set fetch-retries 10
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh && chown -R nodejs:nodejs /app
USER nodejs
EXPOSE 5000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/server.js"]
