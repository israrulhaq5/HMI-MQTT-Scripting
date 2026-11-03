# HMI MQTT Scripting — Weintek cMT2078X

This `weintek` branch archives the complete successful Windows MQTT-to-HTTP to Weintek JavaScript workflow (3 Nov 2026).

## Goal and demonstrated result
Display live simulated MQTT telemetry **without adding an MQTT Device, an MQTT Topic Subscriber, or individual LW registers** in EasyBuilder Pro. User screenshots confirmed local HTTP API responding and the cMT Viewer **offline simulation** rendering all 14 parameters with LIVE. The actual physical cMT2078X and 100ms sustained polling performance have **not** been verified.

`Windows PowerShell -> 178.16.137.85:1883 -> Windows Python bridge -> http://127.0.0.1:8765/api/simgrid1 -> Weintek JS Object Canvas`

- MQTT topic: `data/AMXSIM31A7C9/simgrid1/SIMTERM001` (simulator test topic)
- Python bridge MQTT client uses `paho-mqtt`
- HMI HTTP resource: `tutorial-webrequest_request-0.0.4.js` (download and import from Weintek; not copied into this repository)
- HTTP API: `GET http://127.0.0.1:8765/api/simgrid1` (same-PC only)
- HMI latest poll target: **100ms**; PowerShell source publish target: **200ms**
- Metrics: HTTP response duration; UPD interval between successful HTTP callbacks; New data = polling detection interval when message count changes; not exact MQTT arrival rate.

## Repository files
- [Working Weintek 100ms 14-parameter JS Object](weintek/AMX_Weintek_MQTT_Monitor_100ms.js)
- [Windows Python MQTT-to-HTTP bridge](bridge/AMX_MQTT_Bridge.py)
- [Sample PowerShell test publisher](simulator/AMX_MQTT_Test_Publisher.ps1) — **new example, not the user's exact local V6 script**
- [Full context, history, troubleshooting, acceptance status](docs/WORKING_CONTEXT.md)
- [Python requirements](requirements.txt)

## Run on Windows PC
1. Start existing PowerShell MQTT publisher (or the example after installing the official Mosquitto Windows client).
2. CMD: `py -m pip install -r requirements.txt`
3. CMD: `py bridge/AMX_MQTT_Bridge.py`. Leave this open.
4. CMD: `curl.exe http://127.0.0.1:8765/api/simgrid1` — expect `live:true`, changing `message_count` and `values`.
5. EasyBuilder Pro: **Object > JS-Related > JS Resource**, import Weintek Web Request JS library. The actual imported resource filename used by user: `tutorial-webrequest_request-0.0.4.js`. Official tutorial: https://dl.weintek.com/public/Document/JS_Object_SDK/Current/tutorial-tutorial-webrequest.html
6. Add JS Object approximately 780×430 pixels. Paste [source code](weintek/AMX_Weintek_MQTT_Monitor_100ms.js). Validate, Apply, OK, and start **offline simulation** on same Windows PC. The code already uses the correct imported `require()` name.
7. Check LIVE and 14 numeric parameters. If `HTTP ERROR`, see [troubleshooting](docs/WORKING_CONTEXT.md). The `No error` callback string from Weintek must be treated as success when HTTP 200 and parseable body are present.

## Deployment and security
This is **read-only simulator monitoring**. Never use synthetic readings for equipment control. MQTT TCP port 1883 is unencrypted and the HTTP bridge is deliberately restricted to `127.0.0.1`. Physical cMT2078X must use a separate securely exposed network endpoint with authentication/TLS and the PC's reachable address, not `127.0.0.1`. Never publicly expose the unauthenticated test bridge.

Keep future HMI platform implementations on separate branches; this branch is the Weintek working-context handoff.
