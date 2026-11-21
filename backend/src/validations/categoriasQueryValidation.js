import { z } from "./zod.js";
import { paginacionValidation } from "./paginacionValidation.js";
import { textoDeBusqueda } from "./textoDeBusqueda.js";

export const categoriasQueryValidation = z
  .object({ q: textoDeBusqueda(50), ...paginacionValidation.shape })
  .strict();
