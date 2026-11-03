/*************************************************************
 HAIWELL A7 MQTT DYNAMIC RECEIVER V15
 Receive ALL fields from the real PakTurkMultan/grid1 JSON.

 IMPORTANT: V14's WORKING CALLBACK ORDER IS PRESERVED:
 1. connect()
 2. onConnect() fires
 3. onMessage() registered after connection
 4. subscribe() called

 START EVENT -> RUN ONCE. Disable earlier MQTT receiver scripts.
 No MQTT Device or External Variables needed for LOGGING.
*************************************************************/

var BROKER = "mqtt://178.16.137.85:1883";
var TOPIC = "data/PakTurkMultan/grid1/7102759109270142113";

var OPTIONS = {
    clientId: "AMXA7MultanV15" + String(Math.floor(Math.random() * 1000000)),
    clean: true,
    reconnectPeriod: 5000
};

// Set false after debugging to avoid one log line per field.
var LOG_EACH_FIELD = true;
var MAX_FIELDS_LOGGED = 80;

var mqtt = null;
var connectCount = 0;
var receiveCount = 0;
var handlerRegistered = false;

function info(s) {
    Common.logger.info("%s", "[A7-V15] " + String(s));
}

function fail(s) {
    Common.logger.error("%s", "[A7-V15] " + String(s));
}

function errorText(e) {
    return (e && e.message) ? String(e.message) : String(e);
}

function payloadToText(payload) {
    if (payload === null || typeof payload === "undefined") {
        return "";
    }
    if (typeof payload === "string") {
        return payload;
    }
    if (typeof payload.toString === "function" &&
        payload.toString !== Object.prototype.toString) {
        return String(payload.toString());
    }
    return JSON.stringify(payload);
}

function receiveMessage(first, second) {
    try {
        receiveCount++;
        info("ONMESSAGE FIRED #" + receiveCount);

        var receivedTopic = "";
        var payload = first;

        // Haiwell usually sends { topic: ..., message: ... }.
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

        info("RX TOPIC=" + (receivedTopic || "<not supplied>"));
        if (receivedTopic && receivedTopic !== TOPIC) {
            info("OTHER TOPIC IGNORED");
            return;
        }

        var raw = payloadToText(payload);
        info("RX LENGTH=" + raw.length);
        if (!raw) {
            fail("EMPTY PAYLOAD");
            return;
        }

        var data;
        try {
            data = JSON.parse(raw);
            if (typeof data === "string") {
                data = JSON.parse(data);
            }
        } catch (parseError) {
            fail("JSON PARSE ERROR=" + errorText(parseError));
            return;
        }

        if (!data || typeof data !== "object") {
            fail("INVALID JSON OBJECT");
            return;
        }

        var fieldCount = 0;
        var shownCount = 0;
        var numericCount = 0;
        for (var key in data) {
            if (!Object.prototype.hasOwnProperty.call(data, key)) {
                continue;
            }
            fieldCount++;
            var value = data[key];
            if (typeof value === "number" ||
                (typeof value === "string" && value !== "" &&
                 isFinite(Number(value)))) {
                numericCount++;
            }
            if (LOG_EACH_FIELD && shownCount < MAX_FIELDS_LOGGED) {
                info("FIELD " + key + "=" + String(value));
                shownCount++;
            }
        }
        info("MESSAGE #" + receiveCount +
             " JSON OK; FIELDS=" + fieldCount +
             " NUMERIC=" + numericCount +
             " LOGGED=" + shownCount);

    } catch (e) {
        fail("RECEIVE EXCEPTION=" + errorText(e));
    }
}

try {
    info("START CLIENT=" + OPTIONS.clientId);
    info("BROKER=" + BROKER);
    info("TOPIC=" + TOPIC);

    mqtt = new Common.MqttUtils();
    mqtt.connect(BROKER, OPTIONS);
    info("CONNECT CALLED");

    mqtt.onError(function(e) {
        fail("MQTT ERROR=" + errorText(e));
    });

    mqtt.onConnect(function() {
        connectCount++;
        info("CONNECTED #" + connectCount);
        try {
            info("STATE=" + String(mqtt.getConnected()));

            // The A7 V14 success depended on onMessage AFTER connect.
            // Do not re-register on every automatic reconnect.
            if (!handlerRegistered) {
                mqtt.onMessage(function(first, second) {
                    receiveMessage(first, second);
                });
                handlerRegistered = true;
                info("ONMESSAGE REGISTERED AFTER CONNECT");
            }

            mqtt.subscribe(TOPIC);
            info("SUBSCRIBE CALLED; WAITING FOR REAL DATA");
        } catch (e) {
            fail("CONNECT/SUBSCRIBE ERROR=" + errorText(e));
        }
    });

    info("CALLBACKS READY");
} catch (e) {
    fail("INIT ERROR=" + errorText(e));
}