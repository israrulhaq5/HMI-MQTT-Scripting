"""Development bridge for Weintek cMT2078X: MQTT -> localhost HTTP."""
import json
import math
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import paho.mqtt.client as mqtt

BROKER = "178.16.137.85"
PORT = 1883
TOPIC = "data/AMXSIM31A7C9/simgrid1/SIMTERM001"
STALE_SECONDS = 3.0
lock = threading.Lock()
state = {"connected": False, "received": 0.0, "count": 0, "values": {}}

def on_connect(client, userdata, flags, reason_code, properties):
    ok = not reason_code.is_failure
    with lock:
        state["connected"] = ok
    if ok:
        client.subscribe(TOPIC, qos=0)
        print("MQTT SUBSCRIBED:", TOPIC, flush=True)
    else:
        print("MQTT FAILED:", reason_code, flush=True)

def on_disconnect(client, userdata, flags, reason_code, properties):
    with lock:
        state["connected"] = False
    print("MQTT DISCONNECTED:", reason_code, flush=True)

def on_message(client, userdata, message):
    if message.topic != TOPIC or len(message.payload) > 65536:
        return
    try:
        payload = json.loads(message.payload.decode("utf-8"))
        if not isinstance(payload, dict):
            return
        values = {}
        for key, value in payload.items():
            if isinstance(value, bool):
                values[key] = value
            elif isinstance(value, (int, float, str)):
                try:
                    n = float(value)
                    if math.isfinite(n):
                        values[key] = n
                except (ValueError, TypeError):
                    values[key] = value
        with lock:
            state["values"] = values
            state["received"] = time.monotonic()
            state["count"] += 1
            count = state["count"]
        if count == 1 or count % 25 == 0:
            print("RECEIVED:", count, values, flush=True)
    except (ValueError, UnicodeError) as e:
        print("INVALID PAYLOAD:", e, flush=True)

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/api/simgrid1":
            self.send_error(404)
            return
        with lock:
            connected = state["connected"]
            received = state["received"]
            values = dict(state["values"])
            count = state["count"]
        age = time.monotonic() - received if received else None
        live = connected and age is not None and age < STALE_SECONDS
        output = {
            "live": bool(live),
            "mqtt_connected": connected,
            "message_count": count,
            "age_seconds": round(age, 2) if age is not None else None,
            "values": values if live else {}
        }
        body = json.dumps(output, allow_nan=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2,
                         client_id="AMX-WEINTEK-HTTP-BRIDGE")
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    client.reconnect_delay_set(min_delay=1, max_delay=30)
    client.connect_async(BROKER, PORT, keepalive=30)
    client.loop_start()
    server = ThreadingHTTPServer(("127.0.0.1", 8765), Handler)
    print("HTTP API: http://127.0.0.1:8765/api/simgrid1", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        client.disconnect()
        client.loop_stop()

if __name__ == "__main__":
    main()
