import request from "supertest";
import { crearContenedor } from "../../src/contenedor.js";
import { crearApp } from "../../src/app.js";
import { leerEntorno } from "../../src/config/entorno.js";
import { CONTRASENIA_DEMO } from "../../src/seeds/sembrar.js";
import { AHORA } from "./domainFactories.js";

export async function crearAppDePrueba({ ahora = AHORA, nodeEnv = "test" } = {}) {
  const contenedor = crearContenedor({
    reloj: { ahora: () => ahora },
    entorno: leerEntorno({ NODE_ENV: "test" }),
  });
  await contenedor.resetear();
  return { app: crearApp(contenedor, { nodeEnv }), contenedor };
}

export async function loginComo(app, email, password = CONTRASENIA_DEMO) {
  const res = await request(app).post("/auth/login").send({ email, password });
  if (res.status !== 200) {
    throw new Error(`No se pudo iniciar sesión como ${email}: ${res.status}`);
  }
  return res.body.token;
}
