import { z } from "./zod.js";
import { vacioComoAusente } from "./vacioComoAusente.js";

export const paginacionValidation = z.object({
  page: vacioComoAusente(z.coerce.number().int().min(1).default(1)),
  limit: vacioComoAusente(z.coerce.number().int().min(1).max(50).default(20)),
});
