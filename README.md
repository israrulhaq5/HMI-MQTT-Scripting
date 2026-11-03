# HMI-MQTT-Scripting — Haiwell branch

This branch preserves **the tested Haiwell A7 / Cloud SCADA3 direct MQTT JavaScript receiver work** and Windows PowerShell 200 ms publisher.

**Verified from the user's HMI and Windows logs:** V14 received real PakTurkMultan MQTT JSON directly in JavaScript, and V17 processed simulator JSON at approximately 200 ms cadence (17 fields, 15 numeric, `RX_ERRORS=0`, `SEQ_GAPS=0` in the observed window). **No MQTT Device and no External Variables are required for subscribing, processing, and logging with these scripts.** Binding the cache to numeric display objects still needs a separately verified HMI variable API.

[Start here](Haiwell/README.md) | [Full context](Haiwell/docs/WORKING_CONTEXT.md) | [Test evidence](Haiwell/docs/TEST_EVIDENCE.md) | [MQTT data schema](Haiwell/docs/MQTT_DATA_CONTRACT.md) | [Troubleshooting](Haiwell/docs/TROUBLESHOOTING.md) | [Next steps](Haiwell/docs/NEXT_STEPS.md)

**Security:** MQTT examples target the known test broker over plaintext TCP 1883. Do not commit passwords or publish control commands. Use appropriate ACL/TLS for production.
