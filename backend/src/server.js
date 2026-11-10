import "dotenv/config";
import { leerEntorno } from "./config/entorno.js";
import { crearServidor } from "./servidor.js";

const entorno = leerEntorno();
const { servidor, contenedor } = crearServidor({ entorno });
await contenedor.resetear();

servidor.listen(entorno.port, "0.0.0.0", () => {
  console.log(`API y Socket.io escuchando en http://0.0.0.0:${entorno.port} (${entorno.nodeEnv})`);
});
