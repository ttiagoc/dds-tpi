import { crearContenedor } from "../../src/contenedor.js";
import { crearApp } from "../../src/app.js";
import { AHORA } from "./domainFactories.js";

export async function crearAppDePrueba({ ahora = AHORA, nodeEnv = "test" } = {}) {
  const contenedor = crearContenedor({ reloj: { ahora: () => ahora } });
  await contenedor.resetear();
  return { app: crearApp(contenedor, { nodeEnv }), contenedor };
}
