FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -S phasma && adduser -S -G phasma phasma
COPY --from=builder --chown=phasma:phasma /app/build ./build
COPY --from=builder --chown=phasma:phasma /app/package*.json ./
RUN npm ci --omit=dev
USER phasma
ENV NODE_ENV=production
ENV PORT=8080
ENV BODY_SIZE_LIMIT=1100K
EXPOSE 8080
CMD ["node", "build"]
