import "dotenv/config";
import http from "node:http";
import { leerEntorno } from "./config/entorno.js";
import { crearContenedor } from "./contenedor.js";
import { crearApp } from "./app.js";

const entorno = leerEntorno();
const contenedor = crearContenedor();
const app = crearApp(contenedor, { nodeEnv: entorno.nodeEnv });
const servidor = http.createServer(app);

servidor.listen(entorno.port, "0.0.0.0", () => {
  console.log(`API escuchando en http://0.0.0.0:${entorno.port} (${entorno.nodeEnv})`);
});
