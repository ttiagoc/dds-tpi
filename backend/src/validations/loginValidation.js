import { z } from "./zod.js";

export const loginValidation = z
  .object({
    email: z.email("El email no es válido"),
    password: z.string().min(1, "La contraseña es obligatoria"),
  })
  .strict();
