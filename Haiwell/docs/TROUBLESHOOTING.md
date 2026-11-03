# Known problems and fixes

1. **PowerShell `>>` prompt after paste:** PowerShell is still waiting for the end of a multi-line script/block. Press Ctrl+C; save the full script into a `.ps1` file and run it with `-File`.
2. **`-File ... does not exist`:** wrong filename/path. Use `Test-Path "$env:USERPROFILE\Downloads\AMX_MQTT_200ms_Publisher_V6.ps1"` and save script with `All Files` rather than accidentally `.ps1.txt`.
3. **Project Code "English letters and numbers only":** use `AMXSIM31A7C9` rather than underscore-separated code in the native Haiwell MQTT configuration. This does not ban underscores in JSON channel identifiers.
4. **Connected and subscribe called but no JSON:** V11/V13 demonstrated this. Keep callback registration **inside onConnect, then subscribe**. V14 is the proven reference. Examine the real MQTT message event, not just subscription method return.
5. **`setInterval` / `clearInterval` not defined:** A7 checker rejected them in V12; V14/V17 avoid timers.
6. **Real topic source doubt:** verify separately with MQTT Explorer or `mosquitto_sub -h 178.16.137.85 -p 1883 -t "data/PakTurkMultan/grid1/7102759109270142113" -q 0 -d -v -C 1 -W 60`. Windows SUBACK belongs to Windows client, not A7.
7. **200ms input but only logs every ~5 sec:** V17 intentionally prints every 25th *valid* message to prevent log overload. It parses each message.
8. **Sequence gaps vs startup offset:** `SEQ` higher than `RX_OK` alone is not lost packets. Watch consecutive `SIM_SEQ` increments, `SEQ_GAPS` and `SEQ_RESETS`.
9. **HMI `-8888.88` in Designer:** design-time placeholder is not a receive-path failure. Script caches aren't proven as Numeric Display bindings.
10. **Security/permissions:** plain MQTT over port 1883 is not confidential. Never write to production feeds from random-test scripts. Use TLS/auth/ACL for deployment.

Keep each HMI client in **Start Event -> Run Once** only and disable any prior MQTT JS receivers before replacing with V17.
