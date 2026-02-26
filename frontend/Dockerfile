FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY serve.js ./

RUN npm install express http-proxy-middleware

EXPOSE 8085

CMD ["node", "serve.js"]
