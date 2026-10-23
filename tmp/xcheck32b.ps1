Set-Location D:\work\study114
Write-Output "=== mypage rail render ==="
Select-String -Path preview\home-ui\src\mypage\shell.js -Pattern 'renderPromo|renderRight|railSlot|homeBase|linkMode|absolute' | ForEach-Object { $_.LineNumber.ToString() + ":" + $_.Line.Trim() }
Write-Output "=== preview-links ==="
Get-Content preview\shared\preview-links.js
Write-Output "=== verify concern how it loads ==="
Select-String -Path scripts\verify-rail-concern-banners.mjs -Pattern 'import\.meta|preview-links|HOME_UI|createRequire|vite' | ForEach-Object { $_.LineNumber.ToString() + ":" + $_.Line.Trim() }
Write-Output "=== git status short claimed vs extra ==="
git status --short
