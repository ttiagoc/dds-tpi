import { z } from "./zod.js";

const texto = z.string().trim().min(1).max(100);

export const ubicacionQueryValidation = z
  .object({
    calle: texto,
    numero: z.string().regex(/^\d+$/).pipe(z.coerce.number().int().min(1).max(99999)),
    localidad: texto,
    provincia: texto,
  })
  .strict();
