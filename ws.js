// ws.js
import path from "path";
import http from "http";
import express from "express";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8080;

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app);
server.listen(PORT, () => console.log("HTTP+WS on :" + PORT));

// два WS-эндпойнта на ОДНОМ порту
const wssStream = new WebSocketServer({ noServer: true }); // /stream (ESP32 → сервер)
const wssListen = new WebSocketServer({ noServer: true }); // /listen (сервер → браузеры)

let listeners = new Set();
let frames = 0;

wssListen.on("connection", (ws) => {
  listeners.add(ws);
  console.log("Listener connected");
  ws.on("close", () => listeners.delete(ws));
});

wssStream.on("connection", (ws) => {
  console.log("Sender connected");
  ws.on("message", (msg, isBinary) => {
    // при необходимости можно проверять isBinary === true
    frames++;
    if (frames % 50 === 0) {
      console.log(`relay: ${frames} frames, last ${msg.length} bytes`);
    }
    for (const cli of listeners) {
      if (cli.readyState === 1) cli.send(msg, { binary: true });
    }
  });
});

server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/stream")) {
    wssStream.handleUpgrade(req, socket, head, (ws) =>
      wssStream.emit("connection", ws, req)
    );
  } else if (req.url.startsWith("/listen")) {
    wssListen.handleUpgrade(req, socket, head, (ws) =>
      wssListen.emit("connection", ws, req)
    );
  } else {
    socket.destroy();
  }
});
