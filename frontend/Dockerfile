### Create builder ###

FROM node:8.12-alpine as builder

RUN mkdir -p /ng-app
WORKDIR /ng-app
COPY . .
RUN npm install
RUN $(npm bin)/ng build --prod

### Create server and deploy ###

FROM nginx:9.15-alpine

COPY nginx/default.conf /etc/nginx/conf.d/
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /ng-app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
