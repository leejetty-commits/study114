Set-Location D:\work\study114\preview\home-ui
Write-Output "=== run info verify (may use playwright) ==="
# header of info script for how to run
Select-String -Path ..\..\scripts\verify-rail-info-banners.mjs -Pattern 'vite-node|Usage|실행|playwright' | Select-Object -First 15 | ForEach-Object { $_.LineNumber.ToString() + ":" + $_.Line.Trim() }
npx --yes vite-node ../../scripts/verify-rail-info-banners.mjs 2>&1 | Select-Object -Last 80
