#!/usr/bin/env bash
set -euo pipefail

PROXY_CONF="nginx/proxy.conf"
CURRENT=$(grep -oP 'server app-\K(blue|green)' "$PROXY_CONF" | head -1)

if [ "$CURRENT" = "blue" ]; then
  TARGET="green"
else
  TARGET="blue"
fi

echo "Pull latest code..."
git pull origin main

echo "Current live: $CURRENT"
echo "Deploying to: $TARGET"

echo "Building $TARGET..."
docker compose build "app-$TARGET"

echo "Starting $TARGET..."
docker compose up -d "app-$TARGET"

echo "Waiting for health check..."
for i in $(seq 1 30); do
  if docker compose exec -T "app-$TARGET" wget -qO- http://localhost/ > /dev/null 2>&1; then
    echo "$TARGET is healthy"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "$TARGET failed health check, aborting"
    exit 1
  fi
  sleep 1
done

echo "Switching traffic to $TARGET..."
sed -i "s|server app-$CURRENT:80|server app-$TARGET:80|" "$PROXY_CONF"

echo "Reloading nginx..."
docker compose exec nginx nginx -s reload

echo "Stopping $CURRENT..."
docker compose stop "app-$CURRENT"

echo "Deploy complete. Live: $TARGET"
