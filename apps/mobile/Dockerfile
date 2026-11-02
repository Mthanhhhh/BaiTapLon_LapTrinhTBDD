FROM node:24-alpine AS build
WORKDIR /app
COPY apps/mobile/package.json apps/mobile/package-lock.json ./
RUN npm ci
COPY apps/mobile ./
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL EXPO_OFFLINE=1
RUN npx expo export --platform web --output-dir dist
FROM nginx:1.28-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY infra/independent/frontend.conf /etc/nginx/conf.d/default.conf
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
