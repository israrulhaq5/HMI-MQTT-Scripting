/*
 * Haiwell A7 / SCADA3 - MQTT 200ms receive test V16
 * Start Event -> Run Once; disable older receiver scripts
 * Preserves working V14 order: connect -> onConnect -> onMessage -> subscribe
 * No timers, no manually configured MQTT Device or External Variables for logging
 */
var BROKER = "mqtt://178.16.137.85:1883";
var TOPIC = "data/AMXSIM31A7C9/simgrid1/SIMTERM001";
var OPTIONS = {
    clientId: "A7FastRx" + String(Math.floor(Math.random() * 1000000)),
    clean: true,
    reconnectPeriod: 5000
};
var mqtt = null;
var handlerRegistered = false;
var rxCount = 0;
var validCount = 0;
var badCount = 0;
var lastSeq = null;
var gapCount = 0;
var latest = null;

function info(s) { Common.logger.info("%s", "[A7-V16] " + String(s)); }
function fail(s) { Common.logger.error("%s", "[A7-V16] " + String(s)); }
function errText(e) { return e && e.message ? String(e.message) : String(e); }

function onReceive(res, second) {
    rxCount++;
    try {
        var topic = "";
        var payload = res;
        if (res && typeof res === "object" && typeof res.topic !== "undefined") {
            topic = String(res.topic);
            if (typeof res.message !== "undefined") { payload = res.message; }
            else if (typeof res.payload !== "undefined") { payload = res.payload; }
            else { payload = second; }
        } else if (typeof res === "string" && typeof second !== "undefined") {
            topic = res;
            payload = second;
        }
        if (topic && topic !== TOPIC) { return; }
        if (payload === null || typeof payload === "undefined") { throw new Error("Empty payload"); }
        var raw = typeof payload === "string" ? payload : String(payload.toString());
        var data = JSON.parse(raw);
        if (typeof data === "string") { data = JSON.parse(data); }
        if (!data || typeof data !== "object") { throw new Error("Not an object"); }

        // Keep the entire JSON object, including all additional keys.
        latest = data;
        validCount++;
        var seq = Number(data.SIM_SEQ);
        if (typeof data.SIM_SEQ !== "undefined" && isFinite(seq)) {
            if (lastSeq !== null && seq > lastSeq + 1) {
                gapCount += seq - lastSeq - 1;
            }
            lastSeq = seq;
        }

        // At 200ms, logging every frame can overwhelm the HMI runtime.
        // Print once, then once per 25 valid frames (~5 sec at 5Hz).
        if (validCount === 1 || (validCount % 25) === 0) {
            var count = 0;
            for (var key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) { count++; }
            }
            info("RX_OK=" + validCount +
                 " SEQ=" + String(data.SIM_SEQ) +
                 " V1=" + String(data.SIM_V1) +
                 " A1=" + String(data.SIM_A1) +
                 " KW=" + String(data.SIM_KW_TOTAL) +
                 " HZ=" + String(data.SIM_HZ) +
                 " FIELDS=" + count +
                 " SEQ_GAPS=" + gapCount +
                 " ERRORS=" + badCount);
        }
    } catch (e) {
        badCount++;
        if (badCount === 1 || (badCount % 25) === 0) {
            fail("RX ERROR #" + badCount + ": " + errText(e));
        }
    }
}

try {
    info("START CLIENT=" + OPTIONS.clientId);
    info("TOPIC=" + TOPIC);
    mqtt = new Common.MqttUtils();
    mqtt.connect(BROKER, OPTIONS);
    info("CONNECT CALLED");

    mqtt.onError(function(e) { fail("MQTT ERROR=" + errText(e)); });

    mqtt.onConnect(function() {
        try {
            info("CONNECTED=" + String(mqtt.getConnected()));
            // Verified V14 order. Register once, after initial connect.
            if (!handlerRegistered) {
                mqtt.onMessage(function(a, b) { onReceive(a, b); });
                handlerRegistered = true;
                info("ONMESSAGE REGISTERED AFTER CONNECT");
            }
            mqtt.subscribe(TOPIC);
            info("SUBSCRIBE CALLED; WAITING FOR SIM DATA");
        } catch (e) { fail("ONCONNECT ERROR=" + errText(e)); }
    });
    info("CALLBACKS READY");
} catch (e) { fail("INIT ERROR=" + errText(e)); }