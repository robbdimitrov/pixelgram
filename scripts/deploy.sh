#!/usr/bin/env bash
set -euo pipefail

# Bring up the full Phasma stack on a local Kubernetes cluster (e.g. colima/k3s).
# Idempotent: safe to re-run; reuses the cluster, namespace, and port-forward.

CLUSTER="${CLUSTER:-phasma}"
NS="${NS:-phasma}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
K8S_DIR="$ROOT/deploy"
REGISTRY="${REGISTRY:-localhost:5000/phasma}"
APP_HOST="${APP_HOST:-phasma.localhost}"
LOCAL_PORT="${LOCAL_PORT:-8080}"
REMOTE_PORT="${REMOTE_PORT:-8080}"
LOCAL_ORIGIN="${LOCAL_ORIGIN:-http://${APP_HOST}:${LOCAL_PORT}}"
PORT_FORWARD_LOG="${PORT_FORWARD_LOG:-/tmp/phasma-port-forward-${LOCAL_PORT}.log}"
PORT_FORWARD_PID_FILE="${PORT_FORWARD_PID_FILE:-/tmp/phasma-port-forward-${LOCAL_PORT}.pid}"
SEAWEEDFS_IMAGE="chrislusf/seaweedfs:3.76"
DRAGONFLY_IMAGE="docker.dragonflydb.io/dragonflydb/dragonfly:v1.25.0"
MEILISEARCH_IMAGE="getmeili/meilisearch:v1.11.3"

SERVICES=(backend database frontend)
ROLL_OUT_DATABASE=(statefulset/database)
ROLL_OUT_REST=(
  statefulset/storage
  statefulset/cache
  statefulset/search
  statefulset/broker
  deployment/backend
  deployment/frontend
)
ROLL_OUT_CONNECT=(deployment/connect)

log() {
  echo "==> $*"
}

die() {
  echo "error: $*" >&2
  exit 1
}

require_tools() {
  local tool
  for tool in kubectl docker make; do
    command -v "$tool" >/dev/null || die "missing required tool: $tool"
  done
}

require_docker() {
  docker info >/dev/null 2>&1 || die "Docker daemon is not running. Start Docker and try again."
}

random_secret() {
  if command -v openssl >/dev/null; then
    openssl rand -hex 32
    return
  fi

  local secret
  secret="$(LC_ALL=C tr -dc 'a-f0-9' </dev/urandom | head -c 64 || true)"
  [[ ${#secret} -eq 64 ]] || die "failed to generate a secret"
  printf '%s\n' "${secret}"
}

ensure_namespace() {
  kubectl create namespace "${NS}" 2>/dev/null || true
}

ensure_secret() {
  local secret_name="database-credentials"
  if kubectl -n "${NS}" get secret "${secret_name}" >/dev/null 2>&1; then
    ensure_secret_key "${secret_name}" postgres-password
    ensure_secret_key "${secret_name}" session-hash-secret
    ensure_secret_key "${secret_name}" s3-access-key
    ensure_secret_key "${secret_name}" s3-secret-key
    ensure_secret_key "${secret_name}" dragonfly-password
    ensure_secret_key "${secret_name}" meili-master-key
    return
  fi

  log "creating generated application secrets"
  kubectl -n "${NS}" create secret generic "${secret_name}" \
    --from-literal=postgres-password="$(random_secret)" \
    --from-literal=session-hash-secret="$(random_secret)" \
    --from-literal=s3-access-key="$(random_secret)" \
    --from-literal=s3-secret-key="$(random_secret)" \
    --from-literal=dragonfly-password="$(random_secret)" \
    --from-literal=meili-master-key="$(random_secret)"
}

ensure_secret_key() {
  local secret_name="$1"
  local key="$2"
  local existing encoded
  existing="$(kubectl -n "${NS}" get secret "${secret_name}" -o go-template="{{ index .data \"${key}\" }}")"
  if [[ -n "${existing}" && "${existing}" != "<no value>" ]]; then
    return
  fi

  log "adding missing ${key} secret"
  encoded="$(printf '%s' "$(random_secret)" | base64 | tr -d '\n')"
  kubectl -n "${NS}" patch secret "${secret_name}" --type merge \
    -p "{\"data\":{\"${key}\":\"${encoded}\"}}" >/dev/null
}

ensure_tls_secret() {
  local secret_name="frontend-tls"
  local tmpdir
  if kubectl -n "${NS}" get secret "${secret_name}" >/dev/null 2>&1; then
    return
  fi
  command -v openssl >/dev/null || die "missing required tool for local TLS secret: openssl"

  log "creating self-signed TLS secret for ${APP_HOST}"
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "${tmpdir}"' RETURN
  openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
    -keyout "${tmpdir}/tls.key" \
    -out "${tmpdir}/tls.crt" \
    -subj "/CN=${APP_HOST}" \
    -addext "subjectAltName=DNS:${APP_HOST}" >/dev/null 2>&1
  kubectl -n "${NS}" create secret tls "${secret_name}" \
    --cert="${tmpdir}/tls.crt" \
    --key="${tmpdir}/tls.key" >/dev/null
  trap - RETURN
  rm -rf "${tmpdir}"
}

ensure_database_tls_secret() {
  local secret_name="database-tls"
  local tmpdir
  if kubectl -n "${NS}" get secret "${secret_name}" >/dev/null 2>&1; then
    return
  fi
  command -v openssl >/dev/null || die "missing required tool for database TLS secret: openssl"

  log "creating self-signed TLS secret for database"
  tmpdir="$(mktemp -d)"
  trap 'rm -rf "${tmpdir}"' RETURN
  openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
    -keyout "${tmpdir}/tls.key" \
    -out "${tmpdir}/tls.crt" \
    -subj "/CN=database" \
    -addext "subjectAltName=DNS:database,DNS:database.phasma.svc.cluster.local" >/dev/null 2>&1
  kubectl -n "${NS}" create secret tls "${secret_name}" \
    --cert="${tmpdir}/tls.crt" \
    --key="${tmpdir}/tls.key" >/dev/null
  trap - RETURN
  rm -rf "${tmpdir}"
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
      echo "Frontend port-forward is already running on ${LOCAL_ORIGIN}/ (pid ${pid})."
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

build_images() {
  log "building images"
  export DOCKER_BUILDKIT=1
  GIT_SHA="$(git -C "${ROOT}" rev-parse --short HEAD)"
  export GIT_SHA
  make -C "${ROOT}" GIT_SHA="${GIT_SHA}"
  if docker container inspect --format '{{.State.Running}}' phasma-control-plane 2>/dev/null | grep -qx true; then
    log "loading images into kind node"
    docker pull "${SEAWEEDFS_IMAGE}"
    docker pull "${DRAGONFLY_IMAGE}"
    docker pull "${MEILISEARCH_IMAGE}"
    docker save "${REGISTRY}/backend:${GIT_SHA}" | docker exec -i phasma-control-plane ctr --namespace k8s.io images import -
    docker save "${REGISTRY}/database:${GIT_SHA}" | docker exec -i phasma-control-plane ctr --namespace k8s.io images import -
    docker save "${REGISTRY}/frontend:${GIT_SHA}" | docker exec -i phasma-control-plane ctr --namespace k8s.io images import -
    docker save "${SEAWEEDFS_IMAGE}" | docker exec -i phasma-control-plane ctr --namespace k8s.io images import -
    docker save "${DRAGONFLY_IMAGE}" | docker exec -i phasma-control-plane ctr --namespace k8s.io images import -
    docker save "${MEILISEARCH_IMAGE}" | docker exec -i phasma-control-plane ctr --namespace k8s.io images import -
  fi
}

apply_manifests() {
  log "creating namespace and applying manifests"
  ensure_namespace
  ensure_secret
  ensure_tls_secret
  ensure_database_tls_secret
  kubectl apply -f "${K8S_DIR}" -n "${NS}"
  kubectl -n "${NS}" set env deployment/frontend ORIGIN="${LOCAL_ORIGIN}" >/dev/null
  kubectl -n "${NS}" set image deployment/backend backend="${REGISTRY}/backend:${GIT_SHA}" >/dev/null
  kubectl -n "${NS}" set image statefulset/database database="${REGISTRY}/database:${GIT_SHA}" >/dev/null
  kubectl -n "${NS}" set image deployment/frontend frontend="${REGISTRY}/frontend:${GIT_SHA}" >/dev/null
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
  log "restarting all services"
  # Restarting them together ensures the backends drop their DB connections,
  # allowing the database's graceful shutdown to complete instantly.
  rollout_restart "${ROLL_OUT_DATABASE[@]}" "${ROLL_OUT_REST[@]}"

  log "waiting for database"
  wait_for_rollouts "${ROLL_OUT_DATABASE[@]}"

  log "waiting for application services"
  wait_for_rollouts "${ROLL_OUT_REST[@]}"

  log "restarting connect (after broker is ready)"
  rollout_restart "${ROLL_OUT_CONNECT[@]}"
  wait_for_rollouts "${ROLL_OUT_CONNECT[@]}"
}

start_port_forward_background() {
  local supervisor_pid

  # Terminate any existing frontend port-forward to this port to avoid stale connections
  local pids pid
  pids="$(port_pids)"
  if [[ -n "${pids}" ]]; then
    while IFS= read -r pid; do
      if is_frontend_port_forward "${pid}"; then
        log "stopping existing frontend port-forward (pid ${pid})"
        kill "${pid}" 2>/dev/null || true
      fi
    done <<< "${pids}"
    sleep 1
  fi

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
    echo "Background port-forward is starting on ${LOCAL_ORIGIN}/ (supervisor pid ${supervisor_pid})."
    return 0
  fi

  echo "error: failed to start background port-forward. Recent logs:" >&2
  tail -30 "${PORT_FORWARD_LOG}" >&2 || true
  exit 1
}

print_summary() {
  cat <<EOF

==> phasma is up

  Frontend       ${LOCAL_ORIGIN}
  Gateway        in-cluster: http://backend:8080
  Namespace      ${NS}
  Context        $(kubectl config current-context 2>/dev/null || echo "unknown")

  Port-forward   supervisor pid: $(cat "${PORT_FORWARD_PID_FILE}" 2>/dev/null || echo "unknown")
                 logs: ${PORT_FORWARD_LOG}
                 stop: kill \$(cat ${PORT_FORWARD_PID_FILE})

  Pods           kubectl -n ${NS} get pods
  App logs       kubectl -n ${NS} logs deployment/<service> --tail=100
  Database logs  kubectl -n ${NS} logs statefulset/database --tail=100
  Tear down      kubectl delete namespace ${NS}

EOF
}

require_tools
require_docker

if [[ -n "$(port_pids)" ]]; then
  echo "note: local port ${LOCAL_PORT} is already in use; deploy will reuse a frontend port-forward or report the conflict." >&2
fi

build_images
apply_manifests
restart_stack
start_port_forward_background
print_summary
