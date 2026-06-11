FROM node:26.2.0-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM node:26.2.0-alpine
ENV NODE_ENV=production PORT=8080
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist ./dist
USER node
EXPOSE 8080
CMD ["node", "dist/server/server.mjs"]
