FROM node:8.15-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --no-optional
COPY . .
RUN npm run build

CMD ["npm", "start"]
