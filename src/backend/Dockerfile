FROM node:22-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production --no-optional
COPY . .
CMD ["node", "index.js"]
