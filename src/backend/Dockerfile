FROM node:26.2.0-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev --omit=optional
COPY . .
CMD ["node", "index.js"]
