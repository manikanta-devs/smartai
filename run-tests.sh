#!/bin/bash
# Reliable SmartAI smoke test wrapper

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Optional override:
# SMARTAI_API_BASE="https://your-backend.example.com/api" bash run-tests.sh
node "$ROOT_DIR/scripts/smoke-test.mjs"
