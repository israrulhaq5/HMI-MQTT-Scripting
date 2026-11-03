/*
 * AUTOMATRIX - HAIWELL A7 / SCADA3
 * MQTT Simulator 200 ms - ALL PARAMETERS receiver V17
 *
 * Start Event -> Run Once (disable previous MQTT JS receivers)
 * No MQTT Device or External Variables needed for receive/log test.
 * V14 proven callback sequence: connect -> onConnect -> onMessage -> subscribe.
 * No setInterval, clearInterval or browser APIs.
 *
 * Source: Windows PowerShell V6 on dedicated TEST topic only.
 */

var BROKER = "mqtt://178.16.137.85:1883";
var TOPIC = "data/AMXSIM31A7C9/simgrid1/SIMTERM001";
var OPTIONS = {
    clientId: "AMXA7AllRxV17" + String(Math.floor(Math.random() * 1000000)),
    clean: true,
    reconnectPeriod: 5000
};

// Every message is parsed and saved; only periodically logged.
// 25 received messages ~ 5 seconds if 200 ms cadence is maintained.
var LOG_SNAPSHOT_EVERY = 25;
var LOG_SUMMARY_EVERY = 25;

var mqtt = null;
var receiveRegistered = false;
var connectCount = 0;
var receivedCount = 0;
var validCount = 0;
var invalidCount = 0;
var ignoredCount = 0;
var seqGaps = 0;
var seqResets = 0;
var lastSeq = null;
var latestData = null;      // All keys from most recent valid JSON
var latestNumeric = null;   // Numerically parsed fields from most recent JSON

function logInfo(s) {
    Common.logger.info("%s", "[A7-V17] " + String(s));
}
function logError(s) {
    Common.logger.error("%s", "[A7-V17] " + String(s));
}
function errorText(e) {
    return (e && e.message) ? String(e.message) : String(e);
}

function valueToText(x) {
    if (x === null || typeof x === "undefined") { return ""; }
    if (typeof x === "string") { return x; }
    if (typeof x === "object" &&
        typeof x.toString === "function" &&
        x.toString !== Object.prototype.toString) {
        return String(x.toString());
    }
    return JSON.stringify(x);
}

function printAllFields(data) {
    var line = "";
    var fieldCount = 0;
    var key;
    for (key in data) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) { continue; }
        fieldCount++;
        var item = key + "=" + String(data[key]);
        if (line.length > 0 && (line.length + item.length + 3) > 230) {
            logInfo("FIELDS " + line);
            line = "";
        }
        if (line.length > 0) { line += " | "; }
        line += item;
    }
    if (line.length > 0) { logInfo("FIELDS " + line); }
    logInfo("SNAPSHOT COMPLETE; fields=" + fieldCount);
}

function receiveMessage(first, second) {
    receivedCount++;
    try {
        var receivedTopic = "";
        var payload = first;

        if (first && typeof first === "object" &&
            typeof first.topic !== "undefined") {
            receivedTopic = String(first.topic);
            if (typeof first.message !== "undefined") {
                payload = first.message;
            } else if (typeof first.payload !== "undefined") {
                payload = first.payload;
            } else if (typeof first.data !== "undefined") {
                payload = first.data;
            } else {
                payload = second;
            }
        } else if (typeof first === "string" &&
                   typeof second !== "undefined") {
            receivedTopic = first;
            payload = second;
        }

        if (receivedTopic && receivedTopic !== TOPIC) {
            ignoredCount++;
            return;
        }
        var raw = valueToText(payload);
        if (!raw) { throw new Error("Empty MQTT payload"); }
        var data = JSON.parse(raw);
        if (typeof data === "string") { data = JSON.parse(data); }
        if (!data || typeof data !== "object" ||
            Object.prototype.toString.call(data) === "[object Array]") {
            throw new Error("Expected JSON object");
        }

        // Build numeric cache from ALL fields, not only V1 or Hz.
        var numeric = {};
        var fieldCount = 0;
        var numericCount = 0;
        var key;
        for (key in data) {
            if (!Object.prototype.hasOwnProperty.call(data, key)) { continue; }
            fieldCount++;
            var v = data[key];
            if (typeof v === "number" && isFinite(v)) {
                numeric[key] = v;
                numericCount++;
            } else if (typeof v === "string" && v !== "" &&
                       isFinite(Number(v))) {
                numeric[key] = Number(v);
                numericCount++;
            }
        }

        // Update last complete snapshot, with all metadata and channels.
        latestData = data;
        latestNumeric = numeric;
        validCount++;

        // Sequence is sent as a numeric string by PowerShell V6.
        if (typeof data.SIM_SEQ !== "undefined" &&
            isFinite(Number(data.SIM_SEQ))) {
            var seq = Number(data.SIM_SEQ);
            if (lastSeq !== null) {
                if (seq > lastSeq + 1) {
                    seqGaps += (seq - lastSeq - 1);
                } else if (seq <= lastSeq) {
                    seqResets++;
                }
            }
            lastSeq = seq;
        }

        if (validCount === 1 || (validCount % LOG_SUMMARY_EVERY) === 0) {
            logInfo("RX_OK=" + validCount +
                " SEQ=" + String(data.SIM_SEQ) +
                " FIELDS=" + fieldCount +
                " NUMERIC=" + numericCount +
                " RX_ERRORS=" + invalidCount +
                " SEQ_GAPS=" + seqGaps +
                " SEQ_RESETS=" + seqResets);
        }
        if (validCount === 1 || (validCount % LOG_SNAPSHOT_EVERY) === 0) {
            printAllFields(data);
        }
    } catch (e) {
        invalidCount++;
        if (invalidCount === 1 || (invalidCount % 25) === 0) {
            logError("RECEIVE ERROR #" + invalidCount + " " + errorText(e));
        }
    }
}

try {
    logInfo("START CLIENT=" + OPTIONS.clientId);
    logInfo("BROKER=" + BROKER);
    logInfo("TOPIC=" + TOPIC);
    mqtt = new Common.MqttUtils();
    mqtt.connect(BROKER, OPTIONS);
    logInfo("CONNECT CALLED");

    mqtt.onError(function(e) {
        logError("MQTT ERROR=" + errorText(e));
    });

    mqtt.onConnect(function() {
        connectCount++;
        try {
            logInfo("CONNECTED #" + connectCount +
                " STATE=" + String(mqtt.getConnected()));

            // CRITICAL: same ordering demonstrated working in V14.
            if (!receiveRegistered) {
                mqtt.onMessage(function(a, b) { receiveMessage(a, b); });
                receiveRegistered = true;
                logInfo("ONMESSAGE REGISTERED AFTER CONNECT");
            }
            mqtt.subscribe(TOPIC);
            logInfo("SUBSCRIBE CALLED; awaiting PUBLISH");
        } catch (e) {
            logError("ONCONNECT ERROR=" + errorText(e));
        }
    });
    logInfo("CALLBACKS READY");
} catch (e) {
    logError("INIT ERROR=" + errorText(e));
}