import { io as conectarCliente } from "socket.io-client";
import { crearServidor } from "../../src/servidor.js";
import { leerEntorno } from "../../src/config/entorno.js";
import { AHORA } from "./domainFactories.js";

const ESPERA_MAXIMA_MS = 1500;
const ESPERA_SILENCIO_MS = 100;

export async function levantarServidorDePrueba({ ahora = AHORA } = {}) {
  const { servidor, io, contenedor, app } = crearServidor({
    entorno: leerEntorno({ NODE_ENV: "test" }),
    reloj: { ahora: () => ahora },
  });
  await contenedor.resetear();
  await new Promise((resolve) => servidor.listen(0, resolve));
  const url = `http://localhost:${servidor.address().port}`;
  const clientes = [];

  return {
    app,
    contenedor,
    conectar(token, { transports = ["websocket"] } = {}) {
      const cliente = conectarCliente(url, {
        auth: token ? { token } : {},
        transports,
        reconnection: false,
        forceNew: true,
      });
      clientes.push(cliente);
      return new Promise((resolve, reject) => {
        cliente.once("connect", () => resolve(cliente));
        cliente.once("connect_error", reject);
      });
    },
    cerrar() {
      clientes.forEach((cliente) => cliente.disconnect());
      return new Promise((resolve) => io.close(() => resolve()));
    },
  };
}

export const unirse = (cliente, compraId) => cliente.emitWithAck("compra:unirse", { compraId });

export function escuchar(cliente, evento) {
  const recibidos = [];
  cliente.on(evento, (payload) => recibidos.push(payload));
  return recibidos;
}

export function esperarEvento(cliente, evento) {
  return new Promise((resolve, reject) => {
    const plazo = setTimeout(
      () => reject(new Error(`No llegó ${evento} en ${ESPERA_MAXIMA_MS} ms`)),
      ESPERA_MAXIMA_MS,
    );
    cliente.once(evento, (payload) => {
      clearTimeout(plazo);
      resolve(payload);
    });
  });
}

export async function recibidosDurante(cliente, evento, accion, { testigo } = {}) {
  const recibidos = escuchar(cliente, evento);
  const llegaAlTestigo = testigo ? esperarEvento(testigo, evento) : null;
  await accion();
  await llegaAlTestigo;
  await esperarSilencio();
  return recibidos;
}

export const esperarSilencio = () =>
  new Promise((resolve) => setTimeout(resolve, ESPERA_SILENCIO_MS));
