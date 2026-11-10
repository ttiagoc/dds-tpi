import { relojSistema } from "./config/reloj.js";

export function crearContenedor({ reloj = relojSistema } = {}) {
  const repos = {};
  const servicios = {};

  async function resetear() {}

  return { reloj, repos, servicios, resetear };
}
