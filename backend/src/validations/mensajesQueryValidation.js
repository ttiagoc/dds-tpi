import { z } from "./zod.js";
import { vacioComoAusente } from "./vacioComoAusente.js";
import { LIMITE_POR_PAGINA } from "./paginacionValidation.js";

export const MENSAJES_POR_PAGINA = 30;

export const mensajesQueryValidation = z
  .object({
    antesDe: vacioComoAusente(z.coerce.number().int().min(1).optional()),
    limit: vacioComoAusente(
      z.coerce.number().int().min(1).max(LIMITE_POR_PAGINA).default(MENSAJES_POR_PAGINA),
    ),
  })
  .strict();
