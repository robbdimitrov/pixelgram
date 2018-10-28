### Create node instance, build and deploy ###

FROM node:8.12-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN npm install --no-optional
RUN npm run build

CMD ["npm", "start"]
