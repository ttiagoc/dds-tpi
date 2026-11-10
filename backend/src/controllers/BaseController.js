import { BadRequestError } from "../errors/AppError.js";
import { detallesZod } from "../validations/detallesZod.js";
import { parsearId } from "../validations/parsearId.js";

export class BaseController {
  parsearId(valor) {
    return parsearId(valor);
  }

  extraerYValidarQuery(query, schema) {
    const resultado = schema.safeParse(query ?? {});
    if (!resultado.success) {
      throw new BadRequestError("Parámetros de consulta inválidos", detallesZod(resultado.error));
    }
    return resultado.data;
  }
}
