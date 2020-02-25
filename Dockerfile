FROM alpine:edge

# Installs latest Chromium (77) package.
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  freetype-dev \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  nodejs \
  npm \
  yarn

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Puppeteer v1.19.0 works with Chromium 77.
RUN yarn add puppeteer@1.19.0

# Add user so we don't need --no-sandbox.
RUN addgroup -S pptruser && adduser -S -g pptruser pptruser \
  && mkdir -p /home/pptruser/Downloads /app \
  && chown -R pptruser:pptruser /home/pptruser \
  && chown -R pptruser:pptruser /app

RUN apk add git

WORKDIR /usr/src/collie-cli

COPY package*.json ./

RUN apk add --no-cache --virtual .gyp python make g++ \
  && npm i --only=production \
  && apk del .gyp

USER pptruser

COPY . .

CMD ["sh", "-c", "npm run start:dev"]