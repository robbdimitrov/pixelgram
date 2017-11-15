FROM node:9.1-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN npm install --no-optional
RUN npm run build
