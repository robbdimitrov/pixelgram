FROM node:26.2.0-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=optional --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
