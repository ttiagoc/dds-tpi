import { z } from "./zod.js";
import { paginacionValidation } from "./paginacionValidation.js";
import { textoDeBusqueda } from "./textoDeBusqueda.js";
import { vacioComoAusente } from "./vacioComoAusente.js";

const precio = vacioComoAusente(z.coerce.number().min(0).optional());

export const eventosQueryValidation = z
  .object({
    q: textoDeBusqueda(100),
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
