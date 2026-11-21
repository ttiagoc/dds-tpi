import { almacenDe } from "../almacen/almacen";

const CLAVE = "preferencia-tema";
export const PREFERENCIAS = ["claro", "oscuro", "automatico"];
export const PREFERENCIA_POR_DEFECTO = "claro";

const esValida = (valor) => PREFERENCIAS.includes(valor);

export async function leerPreferencia() {
  try {
    const guardada = await almacenDe(CLAVE).leer();
    return esValida(guardada) ? guardada : PREFERENCIA_POR_DEFECTO;
  } catch {
    return PREFERENCIA_POR_DEFECTO;
  }
}

export const guardarPreferencia = (preferencia) => almacenDe(CLAVE).escribir(preferencia);

export function esOscuro(preferencia, esquemaDelSistema) {
  if (preferencia === "automatico") return esquemaDelSistema === "dark";
  return preferencia === "oscuro";
}
