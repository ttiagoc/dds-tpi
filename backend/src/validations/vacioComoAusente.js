import { z } from "./zod.js";

const esVacio = (valor) => typeof valor === "string" && valor.trim() === "";

export const vacioComoAusente = (schema) =>
  z.preprocess((valor) => (esVacio(valor) ? undefined : valor), schema);
