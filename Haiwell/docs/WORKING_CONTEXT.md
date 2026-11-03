# Complete development context / history

## Objective
Receive third-party MQTT topics directly with JavaScript on **Haiwell A7** / Cloud SCADA3. Avoid manually adding a native MQTT Device/Group/Terminal/External Variable for each source. Start with receive + JSON parse + dynamic log. Later connect the data to the HMI screen.

## Equipment, software and identifiers
- HMI: Haiwell A7; Script event: **Start Event -> Run Once**.
- MQTT broker: `mqtt://178.16.137.85:1883`, plaintext TCP.
- **Real (subscribe-only)**: `data/PakTurkMultan/grid1/7102759109270142113`.
- **Dedicated simulated**: `data/AMXSIM31A7C9/simgrid1/SIMTERM001`, from Windows PowerShell publisher V6.
- Windows tools: MQTT Explorer, Mosquitto `mosquitto_sub` and `mosquitto_pub`, Windows PowerShell.
- Both sources use JSON payloads with string measurement values.

## Progress chronology
1. Native MQTT Device method worked for external PowerShell data but required manual Project Code, Data Group, Terminal, Channel IDs and numeric objects. Display observed e.g. `V1=391.32`, `V2=402.58`, `A1=35.56`, `kW=46.30`, `Sequence=1073`. This motivated the *direct JS* option.
2. The Haiwell **Project Code** field rejected underscores: "Project identifier only supports English letters and numbers." Isolated simulator project set to `AMXSIM31A7C9` (while JSON field names may retain underscores), group `simgrid1`, terminal `SIMTERM001`.
3. Earlier PowerShell snippets pasted into an interactive window produced `>>` continuation and filename-not-found errors. Working solution: save code as `.ps1` in Downloads, verify with `Test-Path`, start it via one `powershell.exe -File` command.
4. Haiwell early V5–V13: `Common.MqttUtils()` could connect (`getConnected()=true`) and `subscribe()` returned, but `ONMESSAGE FIRED` was absent. No A7 SUBACK was confirmed. V12's `setInterval`/`clearInterval` failed A7 syntax checking (functions undefined). V13 removed the timer but still did not receive.
5. Independently, Windows `mosquitto_sub -d -v` on the real PakTurkMultan exact topic showed `CONNACK (0)`, `SUBACK QoS0`, `PUBLISH` ~866 bytes. MQTT Explorer also showed live Grid1 JSON, so source/topic/broker were verified for those clients, **not yet for A7**.
6. **V14 breakthrough:** move `onMessage(...)` registration to **inside `onConnect(...)`, before `subscribe(TOPIC)`**. Logs showed 866-byte messages at 18:09:16 / 18:09:26 / 18:09:36 on Nov 2 with live V1=428.36/428.64/428.97 and Hz=50.31/50.32/50.37. That proved A7 direct script receive.
7. V15 introduced dynamic JSON field enumeration for the real topic; preserve the source, but the captured A7 real-source success evidence specifically relates to V14.
8. PowerShell V5 simulator worked at 5-second intervals. PowerShell **V6** moved to one persistent `mosquitto_pub -l` connection for a nominal **200 ms** cadence, rather than reconnecting every message. Windows displayed `SENT seq=250` after ~49.9s.
9. Haiwell V16 introduced a 200ms receiver and V17 extended the all-JSON dynamic cache / logged fields / sequence diagnostics. The A7 **V17** screenshot showed `RX_OK=3225`, `SEQ=5269`, `FIELDS=17`, `NUMERIC=15`, `RX_ERRORS=0`, `SEQ_GAPS=0`, `SEQ_RESETS=0`. Snapshots appeared each 25 frames (~5 sec). All 17 JSON keys were handled.

## Proven / unproven boundaries
**Proven from supplied HMI logs:** direct JavaScript MQTT subscribe and receive without manual MQTT devices/variables, JSON parsing, 17-field processing and successful 200ms-source reception over the observed capture.

**Not proven:** automatic creation of HMI screen tags, JavaScript cache binding to Numeric Displays, persistence, production-ready TLS/auth/ACL, guaranteed QoS0 delivery, exact 200ms end-to-end latency, multi-topic wildcard scaling, or robust reconnect across power cycles. `SIM_SEQ` being higher than `RX_OK` is not a lost-packet count; receiver could have started after the publisher.

**Related but separate experiment:** Python MQTT-to-Modbus TCP (port 1502) and ESP32-S3 Modbus receiver had initial integration work, but their end-to-end telemetry was not verified as part of this successful *direct HMI JavaScript* approach. Do not confuse that bridge with this project's tested scripts.

## Operational safeguards
- Subscribe-only on the real PakTurkMultan topic; simulator publishes only on its separate topic.
- Do not use a cyclic script task that repeatedly creates MQTT clients.
- Keep V14 and V17 working baselines intact for future regression checks.
- No actuator, generator, CAN transmission or industrial control code is included here.
