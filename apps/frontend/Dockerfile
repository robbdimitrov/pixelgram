FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -S pixelgram && adduser -S -G pixelgram pixelgram
COPY --from=builder --chown=pixelgram:pixelgram /app/build ./build
COPY --from=builder --chown=pixelgram:pixelgram /app/package*.json ./
RUN npm ci --omit=dev
USER pixelgram
ENV PORT=8080
EXPOSE 8080
CMD ["node", "build"]
