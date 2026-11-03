# Haiwell A7: MQTT subscribe by JavaScript

## What works
```text
Windows PowerShell random V6 (200 ms)
        |
        v
mosquitto_pub.exe -l -> MQTT TCP 178.16.137.85:1883
        |
        v
Haiwell A7 Common.MqttUtils()  -> JSON.parse -> latestData / latestNumeric
        |
        v
HMI JavaScript logs (all 17 fields, sampled every 25 received messages)
```

The separate **real-source V14** script subscribes read-only to:
`data/PakTurkMultan/grid1/7102759109270142113`.

### Tested code
| File | Role | Evidence |
|---|---|---|
| [V14 real subscriber](scripts/Haiwell_A7_PakTurkMultan_V14_RealSubscriber.js) | Real PakTurkMultan / Grid1 telemetry | Repeated `ONMESSAGE FIRED`, 866-byte JSON, V1/Hz |
| [V15 all-parameter version](scripts/Haiwell_A7_PakTurkMultan_V15_AllParameters.js) | Development step to enumerate real JSON keys | Source preserved; no separate A7 acceptance capture |
| [V17 200ms receiver](scripts/Haiwell_A7_200ms_AllParameters_V17.js) | Simulator MQTT, all keys + JSON cache + counters | `RX_OK=3225`, 17 fields, 15 numeric, 0 error/gap in captured interval |
| [PowerShell V6 publisher](publisher/AMX_MQTT_200ms_Publisher_V6.ps1) | Random JSON at 200 ms using persistent Mosquitto publish connection | `SENT seq=250` at ~49.9 sec |
| [V16 archive](scripts/archive/Haiwell_A7_V16_200ms.js) | Earlier 200ms receiver version | Archived for history |

### Set up A7 receiver
1. Disable earlier MQTT receiver scripts to avoid multiple clients, duplicate subscriptions and misleading logs.
2. In Haiwell Designer, add the full **V17** source to **Project/Machine Start Event -> Run Once**. Do **not** create a client repeatedly in cyclic tasks.
3. Check Syntax and start the runtime. Observe `[A7-V17] CONNECTED`, `ONMESSAGE REGISTERED AFTER CONNECT`, `SUBSCRIBE CALLED`.
4. Publish simulator data using V6; observe **`RX_OK=...`**, `FIELDS=17`, `NUMERIC=15`, changing `SIM_SEQ`. These are actual reception confirmations; `SUBSCRIBE CALLED` alone is not.
5. Leave the process running to observe `SEQ_GAPS`, `SEQ_RESETS` and errors. V17 prints a complete parameter snapshot every 25 accepted frames (nominally 5 seconds), not on each frame.

**Windows PowerShell command** (save `.ps1` in Downloads first):
```powershell
Test-Path "$env:USERPROFILE\Downloads\AMX_MQTT_200ms_Publisher_V6.ps1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\AMX_MQTT_200ms_Publisher_V6.ps1" -IntervalMs 200
```
Use `-MaxMessages 250` for a finite test. Requires Mosquitto installed (`mosquitto_pub.exe` on PATH or in `C:\Program Files\mosquitto\`). Run the command from **PowerShell**; CMD path variables differ.

### Crucial callback ordering
```javascript
mqtt.connect(BROKER, OPTIONS);
mqtt.onConnect(function () {
    mqtt.onMessage(function (res) { /* parse received JSON */ });
    mqtt.subscribe(TOPIC);
});
```
V14 proved reception after **registering onMessage inside onConnect (after connection, before subscribe)**. Earlier scripts logged connection + subscribe but not receive. Keep this ordering in future versions unless another verified A7 API supports it.

To test the **real production MQTT feed**, run V14 instead of V17; do not publish test payloads to the real topic. You only need script-based subscription and log inspection, not manually created MQTT Device/External Variables.

**Not yet proven:** writing JavaScript cache to native HMI internal variables, binding values to screen, dynamic multi-topic subscriptions, power-cycle persistence and production security.
