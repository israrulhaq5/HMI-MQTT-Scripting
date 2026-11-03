# Test evidence and verification levels

This page records **user-observed** HMI/Windows screenshots and uploaded logs, plus independent local syntax/mocked tests. These are not claims of fresh hardware access.

## Real PakTurkMultan — V14, 2026-11-02
```text
18:09:05 [A7-V14] CONNECTED=true
18:09:05 [A7-V14] ONMESSAGE REGISTERED AFTER CONNECT
18:09:05 [A7-V14] SUBSCRIBE RETURN TYPE=undefined
18:09:05 [A7-V14] SUBSCRIBE CALLED; SUBACK UNVERIFIED
18:09:16 [A7-V14] ONMESSAGE FIRED #1
18:09:16 [A7-V14] RX TOPIC=data/PakTurkMultan/grid1/7102759109270142113
18:09:16 [A7-V14] RX LENGTH=866
18:09:16 [A7-V14] JSON OK
18:09:16 [A7-V14] V1=428.36  HZ=50.31
18:09:26 [A7-V14] ONMESSAGE FIRED #2  V1=428.64 HZ=50.32
18:09:36 [A7-V14] ONMESSAGE FIRED #3  V1=428.97 HZ=50.37
```

Independent Windows Mosquitto client: `CONNACK(0)`, `SUBACK QoS 0`, `received PUBLISH` of 866 bytes on same exact topic.

## PowerShell V6, 200ms simulator — 2026-11-02
```text
SENT seq=1   elapsed=0.2s
SENT seq=25  elapsed=4.8s
SENT seq=50  elapsed=9.8s
...
SENT seq=250 elapsed=49.9s
```

## A7 V17 receiver — 2026-11-02
```text
18:47:55.816 [A7-V17] RX_OK=3175 SEQ=5219.00 FIELDS=17 NUMERIC=15 RX_ERRORS=0 SEQ_GAPS=0 SEQ_RESETS=0
18:48:00.813 [A7-V17] RX_OK=3200 SEQ=5244.00 FIELDS=17 NUMERIC=15 RX_ERRORS=0 SEQ_GAPS=0 SEQ_RESETS=0
18:48:05.813 [A7-V17] RX_OK=3225 SEQ=5269.00 FIELDS=17 NUMERIC=15 RX_ERRORS=0 SEQ_GAPS=0 SEQ_RESETS=0
18:48:05.813 [A7-V17] SIM_V1=404.43  SIM_KW_TOTAL=61.16 SIM_HZ=49.95
18:48:05.813 [A7-V17] SNAPSHOT COMPLETE; fields=17
```

Interpretation: 25 accepted frames per ~5 seconds in the observed segment, no detected gaps or parse errors there; **not** a formal latency, packet-loss or long-term soak test.

## Local code checks — 2026-11-03
- `node --check` PASS on V14, V15, V16 and V17.
- Local mocked `Common.MqttUtils` regression PASS on V14 and V17: callback order, JSON payload handling and 50 synthetic V17 messages, 17 keys/15 numeric values, no sequence gaps.
- PowerShell V6 live publishing evidence is from user's Windows screenshot; PowerShell V6 was not executed in this container.

Pass criteria for future hardware validation: actual `ONMESSAGE FIRED` or `RX_OK`, parsed JSON fields with matching topic and changing `SIM_SEQ`; `getConnected=true` or `subscribe()` returning alone is **insufficient**.
