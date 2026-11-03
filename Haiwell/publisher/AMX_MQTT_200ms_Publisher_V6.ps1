param(
    [ValidateRange(100,60000)][int]$IntervalMs = 200,
    [ValidateRange(0,10000000)][int]$MaxMessages = 0
)

# AUTOMATRIX MQTT 200ms SIMULATOR V6
# 1 persistent mosquitto_pub process (-l), 1 MQTT connection
# Destination: dedicated simulator topic (never PakTurkMultan)

$ErrorActionPreference = 'Stop'
$Broker = '178.16.137.85'
$Port = 1883
$Project = 'AMXSIM31A7C9'
$Group = 'simgrid1'
$Terminal = 'SIMTERM001'
$Topic = "data/$Project/$Group/$Terminal"

$exe = $null
$found = Get-Command 'mosquitto_pub.exe' -ErrorAction SilentlyContinue
if ($found) { $exe = $found.Source }
if (-not $exe) {
    $candidate = Join-Path $env:ProgramFiles 'mosquitto\mosquitto_pub.exe'
    if (Test-Path -LiteralPath $candidate) { $exe = $candidate }
}
if (-not $exe -or -not (Test-Path -LiteralPath $exe)) {
    throw 'mosquitto_pub.exe not found. Please confirm Mosquitto installation.'
}

function Rand100([int]$low, [int]$high) {
    return [double](Get-Random -Minimum $low -Maximum ($high + 1)) / 100.0
}
function F2([double]$v) {
    return $v.ToString('F2', [System.Globalization.CultureInfo]::InvariantCulture)
}

# mosquitto_pub -l reads ONE MQTT PUBLISH from EACH stdin line.
# Important: do not use -f here; that reconnects for each message.
$clientId = 'AMXFAST' + $PID
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $exe
$psi.Arguments = "-h $Broker -p $Port -i $clientId -t $Topic -q 0 -k 30 -l"
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $false
$psi.RedirectStandardError = $false
$psi.CreateNoWindow = $true
$proc = New-Object System.Diagnostics.Process
$proc.StartInfo = $psi
if (-not $proc.Start()) { throw 'Could not start mosquitto_pub.exe' }
$proc.StandardInput.NewLine = "`n"
$proc.StandardInput.AutoFlush = $true

$seq = 0
$importKwh = 10000.0
$exportKwh = 500.0
$clock = [System.Diagnostics.Stopwatch]::StartNew()
$nextAtMs = 0.0

Write-Host 'AUTOMATRIX MQTT 200ms SIMULATOR V6' -ForegroundColor Cyan
Write-Host "Broker   : $($Broker):$Port"
Write-Host "Topic    : $Topic"
Write-Host "Interval : $IntervalMs ms (target)"
Write-Host "Client ID: $clientId"
Write-Host "Process  : $exe"
Write-Host 'Ctrl+C to stop. Logs printed every 25 messages.' -ForegroundColor Yellow

try {
    while (($MaxMessages -eq 0) -or ($seq -lt $MaxMessages)) {
        if ($proc.HasExited) {
            throw "mosquitto_pub exited unexpectedly (code $($proc.ExitCode))."
        }

        # Target cadence, measured using monotonic stopwatch.
        $wait = $nextAtMs - $clock.Elapsed.TotalMilliseconds
        if ($wait -gt 1) {
            Start-Sleep -Milliseconds ([int][Math]::Floor($wait))
        }
        $nextAtMs += $IntervalMs
        # Avoid burst catch-up after a long pause.
        if (($clock.Elapsed.TotalMilliseconds - $nextAtMs) -gt $IntervalMs) {
            $nextAtMs = $clock.Elapsed.TotalMilliseconds + $IntervalMs
        }

        $seq++
        $v1 = Rand100 39000 41500
        $v2 = Rand100 39000 41500
        $v3 = Rand100 39000 41500
        $a1 = Rand100 2000 12000
        $a2 = Rand100 2000 12000
        $a3 = Rand100 2000 12000
        $pf = Rand100 95 100
        $hz = Rand100 4980 5020

        $kw1 = [Math]::Round($v1 * $a1 * $pf / (1000 * [Math]::Sqrt(3)), 2)
        $kw2 = [Math]::Round($v2 * $a2 * $pf / (1000 * [Math]::Sqrt(3)), 2)
        $kw3 = [Math]::Round($v3 * $a3 * $pf / (1000 * [Math]::Sqrt(3)), 2)
        $kwT = [Math]::Round($kw1 + $kw2 + $kw3, 2)
        $importKwh += ($kwT * $IntervalMs / 3600000.0)

        # All measurements are strings to match the proven Haiwell JSON format.
        $payload = [ordered]@{
            '_terminalTime' = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss.fff')
            '_groupName' = $Group
            'SIM_SEQ' = (F2 $seq)
            'SIM_V1' = (F2 $v1)
            'SIM_V2' = (F2 $v2)
            'SIM_V3' = (F2 $v3)
            'SIM_A1' = (F2 $a1)
            'SIM_A2' = (F2 $a2)
            'SIM_A3' = (F2 $a3)
            'SIM_KW1' = (F2 $kw1)
            'SIM_KW2' = (F2 $kw2)
            'SIM_KW3' = (F2 $kw3)
            'SIM_KW_TOTAL' = (F2 $kwT)
            'SIM_HZ' = (F2 $hz)
            'SIM_PF' = (F2 $pf)
            'SIM_IMPORT_KWH' = (F2 $importKwh)
            'SIM_EXPORT_KWH' = (F2 $exportKwh)
        }
        $json = ConvertTo-Json -InputObject $payload -Depth 3 -Compress
        $proc.StandardInput.WriteLine($json)

        if ($seq -eq 1 -or ($seq % 25) -eq 0) {
            Write-Host ('[{0}] SENT seq={1} V1={2}V A1={3}A kW={4} Hz={5} elapsed={6:N1}s' -f (Get-Date -Format 'HH:mm:ss.fff'), $seq, (F2 $v1), (F2 $a1), (F2 $kwT), (F2 $hz), $clock.Elapsed.TotalSeconds) -ForegroundColor Green
        }
    }
}
finally {
    if ($proc) {
        try { $proc.StandardInput.Close() } catch {}
        try {
            if (-not $proc.WaitForExit(1500)) { $proc.Kill(); $proc.WaitForExit() }
        } catch {}
        $proc.Dispose()
    }
    Write-Host 'MQTT simulator stopped.' -ForegroundColor Yellow
}