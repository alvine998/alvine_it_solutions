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

  if [ ! -f "$PROXY_CONF" ]; then
    err "Missing $PROXY_CONF — cannot determine live slot."
    exit 1
  fi

  if [ ! -f .env ]; then
    warn ".env file not found. Copying from .env.example..."
    if [ -f .env.example ]; then
      cp .env.example .env
      warn "Edit .env with real secrets before server can connect."
    else
      err "No .env or .env.example found. Create .env with MONGODB_URI."
      exit 1
    fi
  fi
}

# ── Get current live slot ─────────────────────

current_slot() {
  local slot
  slot=$(grep -oE 'server app-(blue|green)' "$PROXY_CONF" 2>/dev/null | head -1 | sed 's/server app-//') || true
  if [ "$slot" = "blue" ] || [ "$slot" = "green" ]; then
    echo "$slot"
  else
    echo "blue"
  fi
}

# Portable in-place sed (works on GNU and BSD/macOS)
sed_inplace() {
  local expr="$1" file="$2"
  if sed --version 2>/dev/null | grep -q GNU; then
    sed -i "$expr" "$file"
  else
    sed -i '' "$expr" "$file"
  fi
}

swap_traffic() {
  local from="$1" to="$2"
  if ! grep -q "server app-$from:80" "$PROXY_CONF"; then
    err "Expected 'server app-$from:80' not found in $PROXY_CONF — aborting swap."
    echo "Current upstream block:"
    grep -E 'server app-(blue|green)' "$PROXY_CONF" || true
    return 1
  fi
  sed_inplace "s|server app-$from:80|server app-$to:80|g" "$PROXY_CONF"
  # Clean BSD sed backup if created
  rm -f "${PROXY_CONF}.bak" 2>/dev/null || true
}

nginx_reload() {
  info "Reloading nginx..."
  if ! $COMPOSE exec -T nginx nginx -t 2>/dev/null; then
    err "nginx -t failed — config invalid, not reloading."
    $COMPOSE exec -T nginx nginx -t || true
    return 1
  fi
  $COMPOSE exec -T nginx nginx -s reload
}

# ── Wait for container health ─────────────────

wait_healthy() {
  local service="$1"
  local timeout="${2:-$HEALTH_TIMEOUT}"
  info "Waiting for $service to become healthy (max ${timeout}s)..."

  for _ in $(seq 1 "$timeout"); do
    local cid status
    cid=$($COMPOSE ps -q "$service" 2>/dev/null | head -1)
    if [ -n "$cid" ]; then
      status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' "$cid" 2>/dev/null || echo "unknown")
      if [ "$status" = "healthy" ]; then
        ok "$service is healthy"
        return 0
      fi
      # No healthcheck defined — check running state
      if [ "$status" = "no-healthcheck" ]; then
        local running
        running=$(docker inspect --format='{{.State.Running}}' "$cid" 2>/dev/null || echo "false")
        if [ "$running" = "true" ]; then
          ok "$service is running (no healthcheck)"
          return 0
        fi
      fi
    fi
    sleep 1
  done

  err "$service failed health check after ${timeout}s"
  $COMPOSE logs --tail=30 "$service" || true
  if [ -n "${cid:-}" ]; then
    docker inspect --format='Health log: {{json .State.Health.Log}}' "$cid" 2>/dev/null | head -c 2000 || true
    echo ""
  fi
  return 1
}

# ── Commands ──────────────────────────────────

cmd_setup() {
  preflight
  info "First-time setup — building all services..."
  $COMPOSE build
  ok "Build complete"

  info "Starting all services..."
  $COMPOSE up -d
  ok "Services started"

  wait_healthy "server" || warn "Server not healthy yet — check logs with ./deploy.sh --logs"
  wait_healthy "nginx"  || true
  info "Nginx available at http://localhost:3025"
  info "API server on port 4005"
}

cmd_deploy() {
  preflight

  local current target
  current=$(current_slot)
  if [ "$current" = "blue" ]; then
    target="green"
  else
    target="blue"
  fi

  info "Current live: ${GREEN}$current${NC}"
  info "Deploying to: ${YELLOW}$target${NC}"

  if git rev-parse --is-inside-work-tree &>/dev/null; then
    info "Pulling latest code..."
    local branch
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    git pull origin "$branch" --ff-only || warn "Git pull failed. Continuing with local code."
  fi

  info "Rebuilding server..."
  $COMPOSE build server
  $COMPOSE up -d server
  wait_healthy "server" || {
    err "Server failed to start. Aborting deploy."
    exit 1
  }

  info "Building app-$target..."
  $COMPOSE build "app-$target"

  info "Starting app-$target..."
  $COMPOSE up -d "app-$target"

  wait_healthy "app-$target" || {
    err "app-$target failed health check. Rolling back."
    $COMPOSE stop "app-$target" || true
    exit 1
  }

  info "Switching traffic: $current → $target"
  if ! swap_traffic "$current" "$target"; then
    err "Traffic switch failed — stopping new slot."
    $COMPOSE stop "app-$target" || true
    exit 1
  fi

  if ! nginx_reload; then
    err "Nginx reload failed — reverting proxy.conf"
    swap_traffic "$target" "$current" || true
    $COMPOSE stop "app-$target" || true
    exit 1
  fi
  ok "Traffic now routed to $target"

  info "Stopping app-$current..."
  $COMPOSE stop "app-$current" || true
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
    $COMPOSE logs --tail=30 server || true
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

  wait_healthy "server" || warn "Server not healthy — check logs."
  wait_healthy "nginx"  || true

  echo ""
  ok "Full rebuild complete. All services started."
  info "Nginx: http://localhost:3025 | API: port 4005"
}

cmd_status() {
  preflight
  echo ""
  info "Service status:"
  echo ""
  $COMPOSE ps
  echo ""
  local current
  current=$(current_slot)
  echo -e "Live frontend slot: ${GREEN}$current${NC}"
  echo ""
  $COMPOSE ps --format "table {{.Service}}\t{{.State}}\t{{.Status}}" 2>/dev/null || true
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
  preflight
  local current target
  current=$(current_slot)
  if [ "$current" = "blue" ]; then
    target="green"
  else
    target="blue"
  fi

  warn "Rolling back: $current → $target"

  local cid
  cid=$($COMPOSE ps -q "app-$target" 2>/dev/null | head -1)
  local is_running="false"
  if [ -n "$cid" ]; then
    is_running=$(docker inspect --format='{{.State.Running}}' "$cid" 2>/dev/null || echo "false")
  fi

  if [ "$is_running" != "true" ]; then
    info "app-$target is not running. Starting it..."
    $COMPOSE up -d "app-$target"
    wait_healthy "app-$target" || {
      err "Rollback target app-$target failed health check. Cannot rollback."
      exit 1
    }
  fi

  swap_traffic "$current" "$target"
  nginx_reload
  ok "Rolled back to $target"
  info "Stopping app-$current..."
  $COMPOSE stop "app-$current" || true
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
  deploy|--deploy) cmd_deploy ;;
  -h|--help|help)
    echo "Usage: $0 [--setup|--server|--full|--status|--logs|--down|--rollback]"
    echo "  (no arg) defaults to blue-green deploy"
    ;;
  *)
    err "Unknown option: $1"
    echo "Usage: $0 [--setup|--server|--full|--status|--logs|--down|--rollback]"
    exit 1
    ;;
esac
