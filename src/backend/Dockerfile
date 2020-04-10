FROM node:13.11-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production --no-optional
COPY . .
CMD ["node", "index.js"]
