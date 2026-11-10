import { z } from "./zod.js";

export const crearMensajeValidation = z
  .object({
    mensaje: z.string().trim().min(1).max(500),
  })
  .strict();
