import { z } from "./zod.js";

export const textoDeBusqueda = (maximo) =>
  z
    .string()
    .transform((texto) => texto.trim())
    .pipe(z.string().max(maximo))
    .transform((texto) => texto || undefined)
    .optional();
