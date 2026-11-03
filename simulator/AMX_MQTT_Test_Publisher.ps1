# Reproducible example, NOT an exact copy of user's local V6 PowerShell publisher.
$exe = "C:\Program Files\mosquitto\mosquitto_pub.exe"
if (-not (Test-Path $exe)) { throw "Install Mosquitto CLI: $exe not found" }
$broker = "178.16.137.85"
$topic = "data/AMXSIM31A7C9/simgrid1/SIMTERM001"
$seq = 0
while ($true) {
    $seq++
    $v1 = [math]::Round(400 + (Get-Random -Minimum 0 -Maximum 2000) / 100, 2)
    $v2 = [math]::Round(400 + (Get-Random -Minimum 0 -Maximum 2000) / 100, 2)
    $v3 = [math]::Round(400 + (Get-Random -Minimum 0 -Maximum 2000) / 100, 2)
    $a1 = [math]::Round((Get-Random -Minimum 0 -Maximum 12000) / 100, 2)
    $a2 = [math]::Round((Get-Random -Minimum 0 -Maximum 12000) / 100, 2)
    $a3 = [math]::Round((Get-Random -Minimum 0 -Maximum 12000) / 100, 2)
    $pf = 0.97
    $p1 = [math]::Round($v1 * $a1 * $pf / 1000, 2)
    $p2 = [math]::Round($v2 * $a2 * $pf / 1000, 2)
    $p3 = [math]::Round($v3 * $a3 * $pf / 1000, 2)
    $payload = [ordered]@{
        SIM_V1=$v1; SIM_V2=$v2; SIM_V3=$v3
        SIM_A1=$a1; SIM_A2=$a2; SIM_A3=$a3
        SIM_KW1=$p1; SIM_KW2=$p2; SIM_KW3=$p3
        SIM_KW_TOTAL=[math]::Round($p1+$p2+$p3,2)
        SIM_HZ=[math]::Round(49.8 + (Get-Random -Minimum 0 -Maximum 40)/100,2)
        SIM_PF=$pf
        SIM_IMPORT_KWH=[math]::Round(10000+$seq*0.01,2)
        SIM_EXPORT_KWH=[math]::Round(500+$seq*0.001,3)
    }
    $json = $payload | ConvertTo-Json -Compress
    & $exe -h $broker -p 1883 -t $topic -m $json -q 0
    if ($LASTEXITCODE -ne 0) { Write-Warning "MQTT publish failed" }
    Start-Sleep -Milliseconds 200
}
