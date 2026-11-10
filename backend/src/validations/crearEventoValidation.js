import { z } from "./zod.js";

const tipoEntrada = z
  .object({
    nombre: z.string(),
    descripcion: z.string().max(200).optional(),
    precio: z.number(),
    cupo: z.number().int(),
  })
  .strict();

export const crearEventoValidation = z
  .object({
    nombre: z.string(),
    descripcion: z.string().max(2000),
    categoriaId: z.number().int().positive(),
    fecha: z.iso.datetime({ offset: true }),
    lugar: z.string(),
    multimedia: z
      .array(z.url({ protocol: /^https?$/ }))
      .max(5)
      .default([]),
    tiposEntrada: z.array(tipoEntrada).min(1).max(10),
  })
  .strict();
