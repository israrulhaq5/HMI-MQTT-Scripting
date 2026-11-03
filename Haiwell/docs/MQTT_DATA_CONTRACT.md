# MQTT data topics and payloads

## Real PakTurkMultan (read only)
- Broker: `178.16.137.85:1883`
- Topic: `data/PakTurkMultan/grid1/7102759109270142113`
- Payload: real JSON, observed ~866 bytes. `_terminalTime`, `_groupName`, and strings such as `Wapda_Gens_W1_V1`, `V2`, `V3`, `A1`, `A2`, `A3`, `KW1`, `KW2`, `KW3`, `KW1_T`, `KVAR1-3`, `KVAR_T`, `KVA1-3`, `KVA_T`, `PF1-3`, `PF_T`, `HZ`, `Positive_KWH`, `Negative_KWH`, `Positive_KVARH`, `Negative_KVARH`. The captured source fields contain prefixes `Wapda_Gens_W1_`; verify exact keys from received data rather than infer missing registers.

## Isolated simulator (PowerShell V6 / HMI V17)
- Topic: `data/AMXSIM31A7C9/simgrid1/SIMTERM001`
- QoS: 0
- Nominal publisher cadence: 200 ms = 5/s
- Each JSON object has **17 fields**, of which **15 are convertible to numbers**:

| JSON key | Meaning |
|---|---|
| `_terminalTime` | Publisher timestamp (string) |
| `_groupName` | `simgrid1` (string) |
| `SIM_SEQ` | Incrementing publisher counter (numeric string) |
| `SIM_V1`, `SIM_V2`, `SIM_V3` | Simulated voltage V |
| `SIM_A1`, `SIM_A2`, `SIM_A3` | Simulated current A |
| `SIM_KW1`, `SIM_KW2`, `SIM_KW3` | Calculated active power per phase |
| `SIM_KW_TOTAL` | Total active power kW |
| `SIM_HZ` | Frequency Hz |
| `SIM_PF` | Power factor |
| `SIM_IMPORT_KWH` | Simulated energy import kWh |
| `SIM_EXPORT_KWH` | Simulated energy export kWh |

V6 outputs numeric values as JSON **strings** with 2 decimal places. V17 parses all object keys dynamically into `latestData` and numeric-convertible keys into `latestNumeric`. These are JavaScript cache variables, *not automatically screen-bound HMI variables*. V17 only logs a full snapshot every 25 valid frames, but parses every received frame.
