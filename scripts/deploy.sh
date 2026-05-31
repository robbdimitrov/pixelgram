#!/usr/bin/env bash
set -euo pipefail

# Bring up the full Pixelgram stack on a local kind cluster.
# Idempotent: safe to re-run; reuses the cluster, namespace, and port-forward.

CLUSTER="${CLUSTER:-pixelgram}"
NS="${NS:-pixelgram}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
K8S_DIR="$ROOT/k8s"
REGISTRY="${REGISTRY:-localhost:5000/pixelgram}"
APP_HOST="${APP_HOST:-pixelgram.localhost}"
LOCAL_PORT="${LOCAL_PORT:-8080}"
REMOTE_PORT="${REMOTE_PORT:-8080}"
PORT_FORWARD_LOG="${PORT_FORWARD_LOG:-/tmp/pixelgram-port-forward-${LOCAL_PORT}.log}"
PORT_FORWARD_PID_FILE="${PORT_FORWARD_PID_FILE:-/tmp/pixelgram-port-forward-${LOCAL_PORT}.pid}"

SERVICES=(backend database frontend)
ROLL_OUT_DATABASE=(deployment/database)
ROLL_OUT_REST=(
  deployment/backend
  deployment/frontend
)

log() {
  echo "==> $*"
}

die() {
  echo "error: $*" >&2
  exit 1
}

require_tools() {
  local tool
  for tool in kind kubectl docker make; do
    command -v "$tool" >/dev/null || die "missing required tool: $tool"
  done
}

require_docker() {
  docker info >/dev/null 2>&1 || die "Docker daemon is not running. Start Docker and try again."
}

port_pids() {
  if command -v lsof >/dev/null; then
    lsof -nP -iTCP:"${LOCAL_PORT}" -sTCP:LISTEN -t 2>/dev/null || true
  fi
}

is_frontend_port_forward() {
  local pid="$1"
  local command
  command="$(ps -p "${pid}" -o command= 2>/dev/null || true)"
  [[ "${command}" == *"kubectl"* ]] &&
    [[ "${command}" == *"port-forward"* ]] &&
    [[ "${command}" == *"service/frontend"* ]] &&
    [[ "${command}" == *"${LOCAL_PORT}:${REMOTE_PORT}"* ]] &&
    [[ "${command}" == *"${NS}"* ]]
}

handle_existing_port_forward() {
  local pids pid
  pids="$(port_pids)"
  if [[ -z "${pids}" ]]; then
    return 1
  fi

  while IFS= read -r pid; do
    if is_frontend_port_forward "${pid}"; then
      echo "Frontend port-forward is already running on http://${APP_HOST}:${LOCAL_PORT}/ (pid ${pid})."
      return 0
    fi
  done <<< "${pids}"

  echo "error: local port ${LOCAL_PORT} is already in use by another process:" >&2
  while IFS= read -r pid; do
    ps -p "${pid}" -o pid=,command= >&2 || true
  done <<< "${pids}"
  echo "Stop that process or rerun with a different port, for example:" >&2
  echo "  LOCAL_PORT=8081 $0" >&2
  exit 1
}

create_cluster() {
  if ! kind get clusters | grep -qx "${CLUSTER}"; then
    log "creating kind cluster '${CLUSTER}'"
    kind create cluster --name "${CLUSTER}"
  else
    log "using existing kind cluster '${CLUSTER}'"
  fi
  kubectl config use-context "kind-${CLUSTER}" >/dev/null
}

build_images() {
  log "building images"
  export DOCKER_BUILDKIT=1
  make -C "${ROOT}"
}

load_images() {
  local images=()
  local service
  for service in "${SERVICES[@]}"; do
    images+=("${REGISTRY}/${service}")
  done

  log "loading images into kind"
  kind load docker-image "${images[@]}" --name "${CLUSTER}"
}

apply_manifests() {
  log "creating namespace and applying manifests"
  kubectl create namespace "${NS}" 2>/dev/null || true
  kubectl apply -f "${K8S_DIR}" -n "${NS}"
}

rollout_restart() {
  local resource
  for resource in "$@"; do
    kubectl -n "${NS}" rollout restart "${resource}"
  done
}

wait_for_rollouts() {
  local failed=()
  local resource
  for resource in "$@"; do
    if ! kubectl -n "${NS}" rollout status "${resource}" --timeout=180s; then
      failed+=("${resource}")
    fi
  done

  if [[ ${#failed[@]} -eq 0 ]]; then
    return 0
  fi

  echo "error: rollout failed for: ${failed[*]}" >&2
  echo "==> current pod statuses"
  kubectl -n "${NS}" get pods
  for resource in "${failed[@]}"; do
    echo "==> recent logs for ${resource}"
    kubectl -n "${NS}" logs "${resource}" --tail=40 || true
  done
  exit 1
}

restart_stack() {
  log "restarting database"
  rollout_restart "${ROLL_OUT_DATABASE[@]}"

  log "waiting for database"
  wait_for_rollouts "${ROLL_OUT_DATABASE[@]}"

  log "restarting application services"
  rollout_restart "${ROLL_OUT_REST[@]}"

  log "waiting for application services"
  wait_for_rollouts "${ROLL_OUT_REST[@]}"
}

start_port_forward_background() {
  local supervisor_pid

  if handle_existing_port_forward; then
    return 0
  fi

  log "starting frontend port-forward in the background"
  LOCAL_PORT="${LOCAL_PORT}" REMOTE_PORT="${REMOTE_PORT}" NS="${NS}" \
    nohup bash -c '
    set -u
    while true; do
      kubectl -n "${NS}" port-forward service/frontend "${LOCAL_PORT}:${REMOTE_PORT}"
      status=$?
      echo "port-forward exited with status ${status}; reconnecting in 3 seconds" >&2
      sleep 3
    done
  ' >> "${PORT_FORWARD_LOG}" 2>&1 &

  supervisor_pid=$!
  disown "${supervisor_pid}" 2>/dev/null || true
  echo "${supervisor_pid}" > "${PORT_FORWARD_PID_FILE}"

  sleep 2
  if handle_existing_port_forward; then
    echo "Background port-forward supervisor pid: ${supervisor_pid}"
    return 0
  fi

  if ps -p "${supervisor_pid}" >/dev/null 2>&1; then
    echo "Background port-forward is starting on http://${APP_HOST}:${LOCAL_PORT}/ (supervisor pid ${supervisor_pid})."
    return 0
  fi

  echo "error: failed to start background port-forward. Recent logs:" >&2
  tail -30 "${PORT_FORWARD_LOG}" >&2 || true
  exit 1
}

print_summary() {
  cat <<EOF

==> pixelgram is up

  Frontend       http://${APP_HOST}:${LOCAL_PORT}
  Gateway        in-cluster: http://backend:8080
  Namespace      ${NS}
  Context        kind-${CLUSTER}

  Port-forward   supervisor pid: \$(cat "${PORT_FORWARD_PID_FILE}" 2>/dev/null || echo "unknown")
                 logs: ${PORT_FORWARD_LOG}
                 stop: kill \$(cat ${PORT_FORWARD_PID_FILE})

  Pods           kubectl -n ${NS} get pods
  Logs           kubectl -n ${NS} logs deployment/<service> --tail=100
  Tear down      kubectl delete -f ${K8S_DIR} -n ${NS}

EOF
}

require_tools
require_docker

if [[ -n "$(port_pids)" ]]; then
  echo "note: local port ${LOCAL_PORT} is already in use; deploy will reuse a frontend port-forward or report the conflict." >&2
fi

create_cluster
build_images
load_images
apply_manifests
restart_stack
start_port_forward_background
print_summary
