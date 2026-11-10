import { z } from "./zod.js";
import { paginacionValidation } from "./paginacionValidation.js";
import { vacioComoAusente } from "./vacioComoAusente.js";

const precio = vacioComoAusente(z.coerce.number().min(0).optional());

export const eventosQueryValidation = z
  .object({
    q: z
      .string()
      .transform((texto) => texto.trim())
      .pipe(z.string().max(100))
      .transform((texto) => texto || undefined)
      .optional(),
    categoria: vacioComoAusente(z.coerce.number().int().positive().optional()),
    precioMin: precio,
    precioMax: precio,
    ordenarPor: z.enum(["fecha", "precio", "puntaje"]).default("fecha"),
    orden: z.enum(["asc", "desc"]).optional(),
    incluirPasados: z
      .enum(["true", "false"])
      .default("false")
      .transform((valor) => valor === "true"),
    ...paginacionValidation.shape,
  })
  .strict()
  .superRefine(({ precioMin, precioMax }, ctx) => {
    if (precioMin != null && precioMax != null && precioMin > precioMax) {
      ctx.addIssue({
        code: "custom",
        path: ["precioMin"],
        message: "precioMin no puede ser mayor que precioMax",
      });
    }
  })
  .transform((query) => ({
    ...query,
    orden: query.orden ?? (query.ordenarPor === "puntaje" ? "desc" : "asc"),
  }));
