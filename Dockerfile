
FROM node:24-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN node ace build


FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/build ./
RUN npm ci --omit=dev


COPY docker-entrypoint.js ./

EXPOSE 3333
CMD ["node", "docker-entrypoint.js"]
