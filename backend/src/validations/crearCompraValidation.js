import { z } from "./zod.js";

export const MAXIMO_ENTRADAS_POR_COMPRA = 10;

export const crearCompraValidation = z
  .object({
    eventoId: z.number().int().positive(),
    tipoEntradaId: z.number().int().positive(),
    cantidad: z.number().int().min(1).max(MAXIMO_ENTRADAS_POR_COMPRA),
  })
  .strict();
