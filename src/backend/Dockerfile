FROM node:26.2.0-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --omit=dev --omit=optional
CMD ["node", "dist/index.js"]
