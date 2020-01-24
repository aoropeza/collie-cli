FROM node:10.18.1-alpine3.9

RUN apk update && \
  apk upgrade && \
  apk add git

WORKDIR /usr/src/collie-cli

COPY package*.json ./

RUN apk add --no-cache --virtual .gyp python make g++ \
  && npm ci --only=production \
  && apk del .gyp

COPY . .