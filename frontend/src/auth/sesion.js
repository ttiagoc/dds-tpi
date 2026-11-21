import { almacenDe } from "../almacen/almacen";

const CLAVE = "sesion";

export async function leerSesion() {
  const guardada = await almacenDe(CLAVE).leer();
  if (!guardada) return null;
  try {
    return JSON.parse(guardada);
  } catch {
    return null;
  }
}

export const guardarSesion = (sesion) => almacenDe(CLAVE).escribir(JSON.stringify(sesion));

export const borrarSesion = () => almacenDe(CLAVE).borrar();
