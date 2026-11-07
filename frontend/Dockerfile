# --- Giai đoạn 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Dùng npm cài pnpm để tránh lỗi mạng của Corepack
RUN npm install -g pnpm@10.15.0

# Copy package.json và lockfile
COPY package*.json pnpm-lock.yaml ./

# Cài dependencies (bỏ --ignore-scripts để tránh lỗi)
RUN pnpm install --frozen-lockfile

COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm run build

# --- Giai đoạn 2: Chạy ---
FROM node:20-alpine
WORKDIR /app

RUN npm install -g pnpm@10.15.0

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.* ./ 

ENV CI=true
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000
CMD ["pnpm", "run", "start"]