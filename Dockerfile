# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22-bookworm-slim

FROM ${NODE_IMAGE} AS deps
WORKDIR /app

COPY anyjobs/package.json anyjobs/package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci


FROM deps AS dev
WORKDIR /app

COPY anyjobs/ ./

EXPOSE 4200
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--port", "4200"]


FROM deps AS ci
WORKDIR /app

COPY anyjobs/ ./

RUN npm run lint

ARG RUN_TESTS=0
RUN if [ "$RUN_TESTS" = "1" ]; then npm test -- --watch=false; fi


FROM deps AS build
WORKDIR /app

COPY anyjobs/ ./

RUN npm run build -- --configuration production --output-path=dist


FROM nginxinc/nginx-unprivileged:stable-alpine AS prod

COPY --chown=101:101 docker/nginx.conf /etc/nginx/conf.d/default.conf
# @angular/build (v17+) emite la app en dist/browser/
COPY --chown=101:101 --from=build /app/dist/browser/ /usr/share/nginx/html/

EXPOSE 8080
