import { z } from "./zod.js";
import { vacioComoAusente } from "./vacioComoAusente.js";

export const LIMITE_POR_PAGINA = 50;

export const paginacionValidation = z.object({
  page: vacioComoAusente(z.coerce.number().int().min(1).default(1)),
  limit: vacioComoAusente(z.coerce.number().int().min(1).max(LIMITE_POR_PAGINA).default(20)),
});
