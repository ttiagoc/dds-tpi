import { z } from "./zod.js";
import { paginacionValidation } from "./paginacionValidation.js";
import { vacioComoAusente } from "./vacioComoAusente.js";
import { EstadoCompra } from "../domain/EstadoCompra.js";

export const comprasQueryValidation = z
  .object({
    estado: vacioComoAusente(z.enum(Object.values(EstadoCompra)).optional()),
    ...paginacionValidation.shape,
  })
  .strict();
