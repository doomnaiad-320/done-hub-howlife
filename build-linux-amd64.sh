#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${ROOT_DIR}"

if ! command -v yarn >/dev/null 2>&1; then
  echo "yarn not found in PATH" >&2
  exit 1
fi

if ! command -v go >/dev/null 2>&1; then
  echo "go not found in PATH" >&2
  exit 1
fi

VERSION="${VERSION:-}"
if [ -z "${VERSION}" ]; then
  if git rev-parse --short HEAD >/dev/null 2>&1; then
    VERSION="$(git rev-parse --short HEAD)"
  elif [ -f "${ROOT_DIR}/VERSION" ] && [ -s "${ROOT_DIR}/VERSION" ]; then
    VERSION="$(cat "${ROOT_DIR}/VERSION")"
  else
    VERSION="dev"
  fi
fi

echo "==> Building web assets with version: ${VERSION}"
yarn --cwd "${ROOT_DIR}/web" install
VITE_APP_VERSION="${VERSION}" yarn --cwd "${ROOT_DIR}/web" run build

mkdir -p "${ROOT_DIR}/.gomodcache" "${ROOT_DIR}/.gocache" "${ROOT_DIR}/.gotmp"

echo "==> Building Linux amd64 binary: done-hub-linux-amd64"
env \
  GOPROXY="${GOPROXY:-https://proxy.golang.org,direct}" \
  GOMODCACHE="${ROOT_DIR}/.gomodcache" \
  GOCACHE="${ROOT_DIR}/.gocache" \
  GOTMPDIR="${ROOT_DIR}/.gotmp" \
  GOOS=linux \
  GOARCH=amd64 \
  CGO_ENABLED=0 \
  go build \
  -o "${ROOT_DIR}/done-hub-linux-amd64" \
  -ldflags "-s -w -X done-hub/common/config.Version=${VERSION}" \
  .

echo "==> Build complete"
ls -lh "${ROOT_DIR}/done-hub-linux-amd64"
file "${ROOT_DIR}/done-hub-linux-amd64"
