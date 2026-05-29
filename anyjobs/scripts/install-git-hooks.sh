#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
cp "${ROOT}/scripts/hooks/pre-commit" "${ROOT}/.git/hooks/pre-commit"
chmod +x "${ROOT}/.git/hooks/pre-commit"
echo "Hook instalado: ${ROOT}/.git/hooks/pre-commit"
