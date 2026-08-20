FROM oven/bun:1 AS build
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_ROUTER_CUSTOMER_URL
ENV VITE_ROUTER_CUSTOMER_URL=$VITE_ROUTER_CUSTOMER_URL
RUN bun run build

FROM nginx:1.27-alpine
RUN apk add --no-cache curl
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx/app.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
