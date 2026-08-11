#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# Alvine IT Solution — Auto Deploy Script
# Usage:
#   ./deploy.sh              Deploy (blue-green swap)
#   ./deploy.sh --setup      First-time setup (build all + start)
#   ./deploy.sh --server     Rebuild server only
#   ./deploy.sh --full       Full rebuild (all services)
#   ./deploy.sh --status     Show service status
#   ./deploy.sh --logs       Tail all logs
#   ./deploy.sh --down       Stop all services
#   ./deploy.sh --rollback   Switch back to previous frontend
# ──────────────────────────────────────────────

PROXY_CONF="nginx/proxy.conf"
COMPOSE="docker compose"
HEALTH_TIMEOUT=60

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; }

# ── Pre-flight checks ────────────────────────

preflight() {
  if ! command -v docker &>/dev/null; then
    err "Docker is not installed."
    exit 1
  fi

  if ! docker compose version &>/dev/null; then
    err "Docker Compose V2 is required."
    exit 1
  fi

  if [ ! -f .env ]; then
    warn ".env file not found. Copying from .env.example..."
    if [ -f .env.example ]; then
      cp .env.example .env
      warn "Edit .env with your MongoDB URI before the server can connect."
    else
      err "No .env or .env.example found. Create .env with MONGODB_URI."
      exit 1
    fi
  fi
}

# ── Get current live slot ─────────────────────

current_slot() {
  grep -oE 'server app-(blue|green)' "$PROXY_CONF" | head -1 | sed 's/server app-//'
}

# ── Wait for container health ─────────────────

wait_healthy() {
  local service="$1"
  local timeout="${2:-$HEALTH_TIMEOUT}"
  info "Waiting for $service to become healthy (max ${timeout}s)..."

  for i in $(seq 1 "$timeout"); do
    local status
    status=$($COMPOSE ps --format json "$service" 2>/dev/null | grep -o '"Health":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ "$status" = "healthy" ]; then
      ok "$service is healthy"
      return 0
    fi
    sleep 1
  done

  err "$service failed health check after ${timeout}s"
  $COMPOSE logs --tail=20 "$service"
  return 1
}

# ── Commands ──────────────────────────────────

cmd_setup() {
  info "First-time setup — building all services..."
  $COMPOSE build
  ok "Build complete"

  info "Starting all services..."
  $COMPOSE up -d
  ok "Services started"

  wait_healthy "server" || true
  info "Nginx available at http://localhost:3025"
  info "API server on port 4005"
}

cmd_deploy() {
  preflight

  local current
  current=$(current_slot)
  local target

  if [ "$current" = "blue" ]; then
    target="green"
  else
    target="blue"
  fi

  info "Current live: ${GREEN}$current${NC}"
  info "Deploying to: ${YELLOW}$target${NC}"

  # Pull latest code
  if git rev-parse --is-inside-work-tree &>/dev/null; then
    info "Pulling latest code..."
    git pull origin main --ff-only || {
      warn "Git pull failed or not a git repo. Continuing with local code."
    }
  fi

  # Build server if server code changed
  info "Rebuilding server..."
  $COMPOSE build server
  $COMPOSE up -d server
  wait_healthy "server" || {
    err "Server failed to start. Aborting."
    exit 1
  }

  # Build target frontend
  info "Building app-$target..."
  $COMPOSE build "app-$target"

  info "Starting app-$target..."
  $COMPOSE up -d "app-$target"

  wait_healthy "app-$target" || {
    err "app-$target failed health check. Rolling back."
    $COMPOSE stop "app-$target"
    exit 1
  }

  # Switch traffic
  info "Switching traffic: $current → $target"
  sed -i '' "s|server app-$current:80|server app-$target:80|" "$PROXY_CONF"

  info "Reloading nginx..."
  $COMPOSE exec nginx nginx -s reload
  ok "Traffic now routed to $target"

  # Stop old slot
  info "Stopping app-$current..."
  $COMPOSE stop "app-$current"
  ok "app-$current stopped"

  echo ""
  ok "Deploy complete!"
  echo -e "  Live frontend: ${GREEN}$target${NC}"
  echo -e "  Nginx:         http://localhost:3025"
  echo -e "  API server:    port 4005"
}

cmd_server() {
  preflight

  info "Rebuilding server only..."
  $COMPOSE build server
  $COMPOSE up -d server
  wait_healthy "server" || {
    err "Server failed to start."
    $COMPOSE logs --tail=20 server
    exit 1
  }
  ok "Server redeployed on port 4005"
}

cmd_full() {
  preflight

  info "Full rebuild — stopping all services..."
  $COMPOSE down

  info "Building all images from scratch..."
  $COMPOSE build --no-cache

  info "Starting all services..."
  $COMPOSE up -d

  wait_healthy "server" || true

  echo ""
  ok "Full rebuild complete. All services started."
  info "Nginx: http://localhost:3025 | API: port 4005"
}

cmd_status() {
  echo ""
  info "Service status:"
  echo ""
  $COMPOSE ps
  echo ""

  local current
  current=$(current_slot)
  info "Live frontend slot: ${GREEN}$current${NC}"
}

cmd_logs() {
  $COMPOSE logs -f --tail=50
}

cmd_down() {
  info "Stopping all services..."
  $COMPOSE down
  ok "All services stopped."
}

cmd_rollback() {
  local current
  current=$(current_slot)
  local target

  if [ "$current" = "blue" ]; then
    target="green"
  else
    target="blue"
  fi

  warn "Rolling back: $current → $target"

  # Check if the rollback target is still running
  local running
  running=$($COMPOSE ps --status running --format json "app-$target" 2>/dev/null)
  if [ -z "$running" ]; then
    info "app-$target is not running. Starting it..."
    $COMPOSE up -d "app-$target"
    wait_healthy "app-$target" || {
      err "Rollback target app-$target failed health check. Cannot rollback."
      exit 1
    }
  fi

  sed -i '' "s|server app-$current:80|server app-$target:80|" "$PROXY_CONF"
  $COMPOSE exec nginx nginx -s reload
  ok "Rolled back to $target"
}

# ── Main ──────────────────────────────────────

case "${1:-deploy}" in
  --setup)    cmd_setup ;;
  --server)   cmd_server ;;
  --full)     cmd_full ;;
  --status)   cmd_status ;;
  --logs)     cmd_logs ;;
  --down)     cmd_down ;;
  --rollback) cmd_rollback ;;
  deploy)     cmd_deploy ;;
  *)
    echo "Usage: $0 [--setup|--server|--full|--status|--logs|--down|--rollback]"
    exit 1
    ;;
esac
