import request from "supertest";
import { crearContenedor } from "../../src/contenedor.js";
import { crearApp } from "../../src/app.js";
import { leerEntorno } from "../../src/config/entorno.js";
import { CONTRASENIA_DEMO } from "../../src/seeds/sembrar.js";
import { AHORA } from "./domainFactories.js";

export async function crearAppDePrueba({ ahora = AHORA, nodeEnv = "test", carpetaImagenes } = {}) {
  const contenedor = crearContenedor({
    reloj: { ahora: () => ahora },
    entorno: leerEntorno({ NODE_ENV: "test" }),
  });
  await contenedor.resetear();
  return { app: crearApp(contenedor, { nodeEnv, carpetaImagenes }), contenedor };
}

export async function loginComo(app, email, password = CONTRASENIA_DEMO) {
  const res = await request(app).post("/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`No se pudo iniciar sesión como ${email}: ${res.status}`);
  }
  return res.body.token;
}

export const conToken = (pedido, token) =>
  token ? pedido.set("Authorization", `Bearer ${token}`) : pedido;

export const eventoDelSeed = (contenedor, nombre) =>
  contenedor.repos.eventoRepository.findOneWhere((e) => e.nombre === nombre);

export async function idDeCompraDelSeed(contenedor, email, nombreEvento) {
  const compra = await contenedor.repos.compraRepository.findOneWhere(
    (c) => c.comprador.email === email && c.evento.nombre === nombreEvento,
  );
  return compra.id;
}

export const ANA = "ana@aiticket.com";
export const BRUNO = "bruno@aiticket.com";
export const FENIX = "fenix@aiticket.com";
export const KONEX = "konex@aiticket.com";

export const pedirComo = async (app, pedido, email) =>
  conToken(pedido, email && (await loginComo(app, email)));
