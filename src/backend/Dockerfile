FROM node:18.12-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --production --no-optional
COPY . .
CMD ["node", "index.js"]
