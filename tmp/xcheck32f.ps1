Set-Location D:\work\study114
# Confirm search layout no longer passes absolute to rail (footer absolute OK)
Select-String -Path preview\search-ui\src\layout.js -Pattern 'renderRightRailSidebar|linkMode|absolute' -Context 0,3 | Out-String
# Confirm boardLoginHref unchanged pattern in popups
Select-String -Path preview\home-ui\src\concern\rail-concern-popup.js,preview\home-ui\src\library\info-rail.js -Pattern 'rail-popup__login|boardLoginHref' | ForEach-Object { $_.Filename + ":" + $_.LineNumber.ToString() + ":" + $_.Line.Trim() }
