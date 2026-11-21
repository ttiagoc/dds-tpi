import { z } from "./zod.js";

const RUTA_IMAGEN_DEL_BACK = /^\/imagenes\/(?!.*\.\.)[\w\-./]+$/;

const imagen = z.union([
  z.url({ protocol: /^https?$/ }),
  z.string().regex(RUTA_IMAGEN_DEL_BACK, "Tiene que ser una URL http(s) o una ruta /imagenes/..."),
]);

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
    direccion: z.string().min(5).max(200),
    multimedia: z.array(imagen).max(5).default([]),
    tiposEntrada: z.array(tipoEntrada).min(1).max(10),
  })
  .strict();
