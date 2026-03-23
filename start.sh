#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "${ROOT_DIR}"

if [ ! -f "${ROOT_DIR}/.envserver" ]; then
  echo ".envserver not found: ${ROOT_DIR}/.envserver" >&2
  exit 1
fi

set -a
source "${ROOT_DIR}/.envserver"
set +a

mkdir -p "${TMPDIR}"
mkdir -p "${TIKTOKEN_CACHE_DIR}"

exec "${ROOT_DIR}/done-hub-linux-amd64"
