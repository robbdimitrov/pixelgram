FROM node:10.16-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --no-optional
COPY . .
CMD ["npm", "start"]
