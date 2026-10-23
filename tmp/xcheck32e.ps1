Set-Location D:\work\study114
Write-Output "=== extra modified files stats (non-claimed) ==="
git diff --stat -- docs/internal/23-board-community-integration-draft.md docs/ssot/09-main-screen-roles.md docs/ssot/16-messages-structure-proposal.md docs/ssot/29-empty-error-permission-ux.md docs/ssot/30-first-route-map-and-screen-inventory.md preview/home-ui/DOC-CHECKLIST.md preview/home-ui/SSOT-ALIGNMENT.md scripts/run-paid-pr-a-e2e.ps1
Write-Output "=== paid-pr-a first lines of diff ==="
git diff -- scripts/run-paid-pr-a-e2e.ps1 | Select-Object -First 40
Write-Output "=== HEAD ==="
git rev-parse HEAD
git log -1 --oneline
Write-Output "=== railSlotAnchor absolute path for home ==="
$lines = Get-Content preview\home-ui\src\right-rail.js
70..100 | ForEach-Object { $_.ToString().PadLeft(4) + "|" + $lines[$_-1] }
150..165 | ForEach-Object { $_.ToString().PadLeft(4) + "|" + $lines[$_-1] }
820..832 | ForEach-Object { $_.ToString().PadLeft(4) + "|" + $lines[$_-1] }
