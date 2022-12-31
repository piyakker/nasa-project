FROM node:lts-alpine

WORKDIR /app
# the reason why we breakdown COPY to many steps is to utilize the layer component in Docker with the cache funciton.
COPY package*.json ./

COPY client/package*.json client/
RUN npm run install-client --omit=dev

COPY server/package*.json server/
RUN npm run install-server --omit=dev

COPY client/ client/
RUN npm run build --prefix client

COPY server/ server/

USER node

CMD ["npm", "start", "--prefix", "server"]

EXPOSE 8000