FROM --platform=linux/arm64 node:20-bullseye AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM --platform=linux/arm64 gcr.io/distroless/nodejs20-debian12:nonroot-arm64 AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY theme.json ./
COPY .env* ./

EXPOSE 5000

CMD ["dist/index.js"]