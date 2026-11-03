/*
 * Haiwell A7 / SCADA3 - MQTT V14 CALLBACK TIMING DIAGNOSTIC
 * One-time Start Event. No MQTT Device or External Variables required.
 * Replace V13; do not run both simultaneously.
 * This is a diagnostic, NOT a confirmed receiving fix.
 */
var BROKER = "mqtt://178.16.137.85:1883";
var TOPIC = "data/PakTurkMultan/grid1/7102759109270142113";
var OPTIONS = {
    clientId: "A7MultanProbe" + String(Math.floor(Math.random() * 1000000)),
    clean: true,
    reconnectPeriod: 5000
};
var mqtt = null;
var connectedEvents = 0;
var receivedEvents = 0;

function info(x) {
    Common.logger.info("%s", "[A7-V14] " + String(x));
}
function fail(x) {
    Common.logger.error("%s", "[A7-V14] " + String(x));
}
function errstr(e) {
    return e && e.message ? String(e.message) : String(e);
}

function incoming(first, second) {
    receivedEvents++;
    info("ONMESSAGE FIRED #" + receivedEvents);
    try {
        var topic = "";
        var msg = first;
        if (first && typeof first === "object" &&
            typeof first.topic !== "undefined") {
            topic = String(first.topic);
            if (typeof first.message !== "undefined") {
                msg = first.message;
            } else if (typeof first.payload !== "undefined") {
                msg = first.payload;
            } else if (typeof first.data !== "undefined") {
                msg = first.data;
            } else {
                msg = second;
            }
        } else if (typeof first === "string" &&
                   typeof second !== "undefined") {
            topic = first;
            msg = second;
        }
        info("RX TOPIC=" + (topic || "<not supplied>"));
        if (topic && topic !== TOPIC) {
            info("SKIP other topic");
            return;
        }
        var raw = "";
        if (typeof msg === "string") {
            raw = msg;
        } else if (msg !== null && typeof msg !== "undefined" &&
                   typeof msg.toString === "function" &&
                   msg.toString !== Object.prototype.toString) {
            raw = String(msg.toString());
        } else if (msg !== null && typeof msg !== "undefined") {
            raw = JSON.stringify(msg);
        }
        info("RX BYTES/TEXT LENGTH=" + raw.length);
        info("RX PREFIX=" + raw.substring(0, 160));
        var data = JSON.parse(raw);
        info("JSON OK V1=" + String(data.Wapda_Gens_W1_V1) +
             " HZ=" + String(data.Wapda_Gens_W1_HZ));
    } catch (e) {
        fail("RX ERROR=" + errstr(e));
    }
}

try {
    info("START " + OPTIONS.clientId);
    mqtt = new Common.MqttUtils();
    mqtt.connect(BROKER, OPTIONS);
    info("CONNECT CALLED");

    mqtt.onError(function(e) {
        fail("MQTT ERROR=" + errstr(e));
    });

    mqtt.onConnect(function() {
        connectedEvents++;
        info("CONNECTED #" + connectedEvents +
             " STATE=" + String(mqtt.getConnected()));
        try {
            // DIFFERENCE FROM V13: register receive handler once the
            // underlying MQTT client is fully connected, BEFORE subscribing.
            mqtt.onMessage(function(first, second) {
                incoming(first, second);
            });
            info("ONMESSAGE REGISTERED AFTER CONNECT");
        } catch (e) {
            fail("ONMESSAGE REGISTRATION ERROR=" + errstr(e));
            return;
        }
        try {
            var subscriptionResult = mqtt.subscribe(TOPIC);
            info("SUBSCRIBE RETURN TYPE=" + typeof subscriptionResult);
            if (typeof subscriptionResult === "number" ||
                typeof subscriptionResult === "string" ||
                typeof subscriptionResult === "boolean") {
                info("SUBSCRIBE RETURN VALUE=" + String(subscriptionResult));
            }
            info("SUBSCRIBE CALLED; SUBACK STILL UNVERIFIED");
        } catch (e) {
            fail("SUBSCRIBE ERROR=" + errstr(e));
        }
    });
    info("ONCONNECT/ONERROR REGISTERED");
} catch (e) {
    fail("INIT ERROR=" + errstr(e));
}