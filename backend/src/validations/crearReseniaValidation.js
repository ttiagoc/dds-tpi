import { z } from "./zod.js";

export const crearReseniaValidation = z
  .object({
    puntuacion: z.number().int().min(1).max(5),
    detalle: z.string().trim().min(1).max(500),
  })
  .strict();
