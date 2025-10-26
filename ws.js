import path from "path";
import express from "express";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTP_PORT = 8080; // отдадим html
const WS_PORT = 9001; // WS для стрима

// --- HTTP (статик) ---
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.listen(HTTP_PORT, () => console.log("HTTP on :" + HTTP_PORT));

// --- WS ---
const wss = new WebSocketServer({ port: WS_PORT });
let listeners = new Set();
let senders = new Set();

wss.on("connection", (ws, req) => {
  const url = req.url || "/";
  const isSender = url.startsWith("/stream");
  if (isSender) {
    senders.add(ws);
    console.log("Sender connected");
  } else {
    listeners.add(ws);
    console.log("Listener connected");
  }

  ws.on("message", (msg, isBinary) => {
    if (!isSender || !isBinary) return;
    // Рассылаем всем слушателям бинарный PCM-фрейм (20 мс)
    for (const cli of listeners) {
      if (cli.readyState === 1) cli.send(msg, { binary: true });
    }
  });

  ws.on("close", () => {
    listeners.delete(ws);
    senders.delete(ws);
  });
});
console.log(
  "WS on :" + WS_PORT + "  (ws://host:9001/stream  |  ws://host:9001/listen)"
);
