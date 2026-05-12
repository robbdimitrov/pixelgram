#!/bin/bash
set -euo pipefail

REGISTRY_NAME="pixelgram-registry"
REGISTRY_PORT=5000
CLUSTER_NAME="pixelgram"
NAMESPACE="pixelgram"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

ensure_registry() {
  if [ "$(docker inspect -f '{{.State.Running}}' "${REGISTRY_NAME}" 2>/dev/null || true)" != 'true' ]; then
    echo "Creating local Docker registry on port ${REGISTRY_PORT}..."
    docker run -d --restart=always -p "127.0.0.1:${REGISTRY_PORT}:5000" --name "${REGISTRY_NAME}" registry:2
  else
    echo "Local registry already running."
  fi
}

ensure_cluster() {
  if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "Kind cluster '${CLUSTER_NAME}' already exists."
  else
    echo "Creating kind cluster '${CLUSTER_NAME}'..."
    kind create cluster --name "${CLUSTER_NAME}"

    echo "Connecting registry to kind network..."
    docker network connect "kind" "${REGISTRY_NAME}" 2>/dev/null || true

    echo "Configuring registry mirror on kind node..."
    REGISTRY_DIR="/etc/containerd/certs.d/localhost:${REGISTRY_PORT}"
    docker exec "${CLUSTER_NAME}-control-plane" mkdir -p "${REGISTRY_DIR}"
    docker exec "${CLUSTER_NAME}-control-plane" sh -c "cat > ${REGISTRY_DIR}/hosts.toml <<'EOF'
server = \"http://${REGISTRY_NAME}:5000\"
capabilities = [\"pull\", \"resolve\"]
EOF"
    docker exec "${CLUSTER_NAME}-control-plane" systemctl restart containerd
  fi
}

build_images() {
  echo "Building images..."
  make
}

push_images() {
  echo "Pushing images to localhost:${REGISTRY_PORT}..."
  docker push "localhost:${REGISTRY_PORT}/pixelgram/backend"
  docker push "localhost:${REGISTRY_PORT}/pixelgram/database"
  docker push "localhost:${REGISTRY_PORT}/pixelgram/frontend"
}

deploy() {
  echo "Creating namespace '${NAMESPACE}'..."
  kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

  echo "Applying k8s manifests..."
  kubectl apply -f ./k8s -n "${NAMESPACE}"

  echo "Waiting for deployments to be ready..."
  kubectl wait --for=condition=available --timeout=300s deployment/backend -n "${NAMESPACE}" || true
  kubectl wait --for=condition=available --timeout=300s deployment/frontend -n "${NAMESPACE}" || true
}

main() {
  if ! command -v kind &>/dev/null; then
    echo "Error: 'kind' is not installed. Install it first: https://kind.sigs.k8s.io/docs/user/quick-start/#installation"
    exit 1
  fi
  if ! command -v kubectl &>/dev/null; then
    echo "Error: 'kubectl' is not installed."
    exit 1
  fi

  ensure_registry
  ensure_cluster
  kubectl config use-context "kind-${CLUSTER_NAME}"
  build_images
  push_images
  deploy
  echo ""
  echo "Deployment complete!"
  echo ""
  echo "Access the app:"
  echo "  kubectl port-forward service/frontend 8080:8080 -n ${NAMESPACE}"
  echo "  http://localhost:8080"
}

main
