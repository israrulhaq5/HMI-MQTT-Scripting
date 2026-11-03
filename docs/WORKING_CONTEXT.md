# Weintek HMI MQTT Script Working Context (3 Nov 2026)

## Scope
The goal is MQTT values on a cMT2078X **without an MQTT Device, MQTT Topic Subscriber, or LW address mapping on the HMI**. Use a read-only JS Object + HTTP bridge. Current success was confirmed **in EasyBuilder Pro offline simulation**, not a physical HMI.

## Architecture and settings
PowerShell 200ms target publisher -> public MQTT broker `178.16.137.85:1883` -> Windows Python paho-mqtt bridge subscribed to `data/AMXSIM31A7C9/simgrid1/SIMTERM001` -> `http://127.0.0.1:8765/api/simgrid1` -> Weintek JS Object.
Use Web Request resource filename `tutorial-webrequest_request-0.0.4.js` imported via **Object > JS-Related > JS Resource**. In JS Object source: `require('./tutorial-webrequest_request-0.0.4.js')`.
Source library instructions: https://dl.weintek.com/public/Document/JS_Object_SDK/Current/tutorial-tutorial-webrequest.html
The official library itself is not redistributed here.

## Fourteen electrical JSON keys
`SIM_V1`, `SIM_V2`, `SIM_V3` (voltage); `SIM_A1`, `SIM_A2`, `SIM_A3` (current); `SIM_KW1`, `SIM_KW2`, `SIM_KW3` and `SIM_KW_TOTAL` (power); `SIM_HZ` (frequency); `SIM_PF` (power factor); `SIM_IMPORT_KWH`, `SIM_EXPORT_KWH` (energy).

## Historical development/testing
1. Started with Weintek native MQTT Subscriber pointing to real site `data/PakTurkSchool/grid1/7112659109310171104`; it mapped string fields to LW-1000..1200 and worked. The ASCII display originally showed only 2 characters because it was configured as one word; increasing to 10 words fixed it. This was a separate baseline, **not** the desired script-only method.
2. Switched to synthetic PowerShell source on **separate test topic** `data/AMXSIM31A7C9/simgrid1/SIMTERM001` targeting 200ms.
3. Initially `mosquitto_pub` executable not in PATH; resolve with full path to Windows Mosquitto client.
4. In CMD, `$env:USERPROFILE` and `Invoke-RestMethod` fail because these are PowerShell syntax. Use `%USERPROFILE%` and `curl.exe http://127.0.0.1:8765/api/simgrid1` in CMD, or invoke PowerShell separately.
5. Python bridge printed subscribed/received messages. Curl confirmed `live: true`, `mqtt_connected: true`, increasing `message_count` (a screenshot had 1093), `age_seconds` near 0.08.
6. Simple JS Canvas script drew "WEINTEK JS WORKING", confirming the renderer.
7. Imported resource appeared with actual filename `tutorial-webrequest_request-0.0.4.js`. Original `require('./request-0.0.4.js')` did not match the imported name.
8. HTTP demo initially showed `Error: No error`: Weintek request callback may put success text `No error` in its error field; treat empty string and `No error` as non-errors and validate HTTP 200 + body separately.
9. Screenshot confirmed single `SIM_V1` on HMI test display with green LIVE and 412.10 V (snapshot), ~24799 MQTT messages.
10. User screenshot subsequently confirmed **all 14 fields LIVE** in 4-column JS dashboard.
11. Added `HTTP` duration, `UPD` successful HMI callback interval, `New data` observed change in HTTP-exposed MQTT message count. These values are not interchangeable.
12. JS refresh interval changed 2000ms -> 1000ms -> requested 50ms -> latest **100ms**. This 100ms is **target poll cadence, not measured confirmation**. MQTT publisher remained a 200ms target; faster polling does not create fresher packets.

## API format
```json
{"live":true,"mqtt_connected":true,"message_count":1093,"age_seconds":0.08,"values":{"SIM_V1":403.09,"SIM_HZ":49.91}}
```
Illustrative subset only; response contains the full latest JSON when available. Bridge marks stale after 3 seconds since last MQTT packet.

## Safety/limits
- Simulated data is monitoring-only: no generator commands, breaker outputs, or actuators.
- Broker TCP 1883 lacks encryption; choose authentication, ACLs, TLS and segregated topics for any production use.
- HTTP bridge deliberately listens on `127.0.0.1:8765`; physical HMI cannot use the PC's loopback address. Secure HTTPS/LAN proxy deployment is a distinct task. Do NOT simply expose port 8765 publicly.
- 100ms polling may request up to ~10 HTTP calls/sec if fast enough; overlapping calls are suppressed.
- The 3000ms request timeout variable marks an outstanding request as timed out but does not cancel it; if the callback never fires, `busy` remains true.
- The JS `New data` statistic measures detection intervals from HTTP snapshots; exact MQTT receive intervals require timing inside Python on_message.
- Check physical HMI firmware compatibility, runtime networking and resource import before declaring hardware acceptance.
