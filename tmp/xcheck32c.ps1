Set-Location D:\work\study114
Write-Output "=== mypage shell around rail ==="
$lines = Get-Content preview\home-ui\src\mypage\shell.js
130..170 | ForEach-Object { $_.ToString().PadLeft(4) + "|" + $lines[$_-1] }
Write-Output "=== run concern verify via vite-node ==="
Set-Location preview\home-ui
npx --yes vite-node ../../scripts/verify-rail-concern-banners.mjs 2>&1 | Select-Object -Last 50
