# Ops recommend API checks with session cookie
$ErrorActionPreference = 'Stop'
$base = 'https://study114.dothome.co.kr'
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession

$loginBody = '{"email":"guardian1@dev.local","password":"password"}'
$login = Invoke-RestMethod -Method POST -Uri "$base/api/auth/login.php" -WebSession $session -ContentType 'application/json; charset=utf-8' -Body $loginBody -TimeoutSec 25
$userLabel = ''
if ($login.user -and $login.user.email) { $userLabel = [string]$login.user.email }
elseif ($login.user_id) { $userLabel = [string]$login.user_id }
Write-Output ("login ok={0} user={1}" -f $login.ok, $userLabel)

function PostRec($body) {
  return Invoke-RestMethod -Method POST -Uri "$base/api/handoff/recommendations.php" -WebSession $session -ContentType 'application/json; charset=utf-8' -Body $body -TimeoutSec 25
}

# use published room id=1 if exists
$room = Invoke-RestMethod -Method POST -Uri "$base/api/search/search.php" -ContentType 'application/json' -Body '{"tab":"room","limit":1,"sort":"latest"}' -TimeoutSec 20
$roomId = [int]$room.items[0].id
Write-Output ("roomId={0} before_count={1}" -f $roomId, $room.items[0].recommend_count)

$add = PostRec (@{ target_type = 'study_room'; target_id = $roomId } | ConvertTo-Json -Compress)
Write-Output ("add recommended={0} count={1}" -f $add.recommended, $add.recommend_count)

$cancel = PostRec (@{ target_type = 'study_room'; target_id = $roomId } | ConvertTo-Json -Compress)
Write-Output ("cancel recommended={0} count={1}" -f $cancel.recommended, $cancel.recommend_count)

$readd = PostRec (@{ target_type = 'study_room'; target_id = $roomId } | ConvertTo-Json -Compress)
Write-Output ("readd recommended={0} count={1}" -f $readd.recommended, $readd.recommend_count)

# rapid fire
$r1 = PostRec (@{ target_type = 'study_room'; target_id = $roomId } | ConvertTo-Json -Compress)
$r2 = PostRec (@{ target_type = 'study_room'; target_id = $roomId } | ConvertTo-Json -Compress)
Write-Output ("rapid1 recommended={0} count={1}" -f $r1.recommended, $r1.recommend_count)
Write-Output ("rapid2 recommended={0} count={1}" -f $r2.recommended, $r2.recommend_count)

try {
  PostRec '{"target_type":"student","target_id":1}' | Out-Null
  Write-Output 'badtype=UNEXPECTED_OK'
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  Write-Output ("badtype status={0}" -f $code)
}

try {
  PostRec '{"target_type":"tutor","target_id":999999}' | Out-Null
  Write-Output 'badid=UNEXPECTED_OK'
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  Write-Output ("badid status={0}" -f $code)
}

# leave cancelled (even count)
if ($r2.recommended) { PostRec (@{ target_type = 'study_room'; target_id = $roomId } | ConvertTo-Json -Compress) | Out-Null }
Write-Output 'ops recommend checks done'
