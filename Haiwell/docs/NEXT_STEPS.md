# Future milestones — not yet verified

1. **HMI display binding:** verify the exact Haiwell A7 JavaScript API to update existing local/internal variables from `latestData` or `latestNumeric`, then bind Numeric Display, trends and alarms. Dynamic JSON keys are **not** proof of dynamic HMI tag creation.
2. **Multi-device dynamic MQTT:** configured allowlist of topics, guarded wildcard subscriptions, topic-based caching with limits and stale-value handling.
3. **Reliability:** reconnect/resubscribe, malformed/oversize JSON, stale age, duplicates/out-of-order, client lifecycle across screens and restarts.
4. **Measured performance:** HMI CPU/memory and end-to-end latency at 200 ms, and only then consider 100/50 ms.
5. **Security:** broker access controls, least-privilege receive-only client, TLS capability/credentials, public broker scope review.
6. **A7 hardware acceptance:** regression test after firmware/SCADA3 upgrades, 1-hour soak and controlled disconnect/reconnect.
7. **Documentation/automation:** maintain changelog for approved new versions; preserve V14/V17 as known-good baselines.

**Separate unfinished experiment:** MQTT-to-Python-Modbus TCP 1502/ESP32-S3 bridge. That was explored earlier but must not be represented as fully validated by these successful direct JavaScript MQTT receiver tests.
