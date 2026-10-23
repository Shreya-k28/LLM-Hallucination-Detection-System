$ErrorActionPreference = "Stop"

$body = @{
  query  = "Did Einstein win the Nobel Prize for the theory of relativity?"
  answer = "He won it for relativity."
} | ConvertTo-Json

Write-Host "POST /detect"
Write-Host $body

try {
  $res = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "http://127.0.0.1:8000/detect" -ContentType "application/json" -Body $body -TimeoutSec 300
  Write-Host "Status:" $res.StatusCode
  Write-Output $res.Content
} catch {
  if ($_.Exception.Response) {
    $status = [int]$_.Exception.Response.StatusCode
    Write-Host "HTTP status:" $status
  }
  Write-Host "Error:" $_.Exception.Message
  throw
}

