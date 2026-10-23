Set-Location D:\work\study114
Write-Output "=== right-rail key lines ==="
Select-String -Path preview\home-ui\src\right-rail.js -Pattern 'target="_blank"|#/guide|data-rail-guide-leave|railLeaveMode|isBlankConcernRail|concernInPageControl|linkMode' | ForEach-Object { $_.LineNumber.ToString() + ":" + $_.Line.Trim() }
Write-Output "=== callers linkMode ==="
Select-String -Path preview\search-ui\src\layout.js,preview\study-room-ui\src\layout.js,preview\tutor-ui\src\layout.js,preview\home-ui\src\mypage\shell.js -Pattern 'linkMode|renderRegisterRightRail|register_right_rail|renderRightRailSidebar|renderPromoWithRightRail' | ForEach-Object { $_.Filename + ":" + $_.LineNumber.ToString() + ":" + $_.Line.Trim() }
Write-Output "=== package verify scripts ==="
Select-String -Path package.json -Pattern 'verify-rail' | ForEach-Object { $_.Line.Trim() }
Write-Output "=== verify concern bootstrap ==="
Get-Content scripts\verify-rail-concern-banners.mjs | Select-Object -Skip 99 -First 50
