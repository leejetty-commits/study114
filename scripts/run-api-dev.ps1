# study114 — Docker PHP API (signup 등)
# Usage:
#   docker compose -f docker/docker-compose.dev.yml up -d api
#   curl http://127.0.0.1:8080/api/auth/signup.php

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Push-Location (Join-Path $root "docker")
try {
  docker compose -f docker-compose.dev.yml up -d --build api
  Write-Host "API: http://127.0.0.1:8080 (container: study114-api-dev)"
} finally {
  Pop-Location
}
