import http from "node:http";
import { Server } from "socket.io";
import { crearContenedor } from "./contenedor.js";
import { crearApp } from "./app.js";
import { crearNotificadorSocket } from "./sockets/notificador.js";
import { registrarChat } from "./sockets/chatSocket.js";

export function crearServidor({ entorno, reloj }) {
  let app;
  const servidor = http.createServer((req, res) => app(req, res));
  const io = new Server(servidor, { cors: { origin: "*" } });
  const contenedor = crearContenedor({ entorno, reloj, notificador: crearNotificadorSocket(io) });
  app = crearApp(contenedor, { nodeEnv: entorno.nodeEnv });
  registrarChat(io, contenedor.servicios);
  return { servidor, io, contenedor, app };
}
