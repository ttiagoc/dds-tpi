import { BadRequestError } from "../errors/AppError.js";
import { detallesZod } from "../validations/detallesZod.js";

const ENTERO_POSITIVO = /^[1-9]\d*$/;

export class BaseController {
  parsearId(valor) {
    const id = Number(valor);
    if (!ENTERO_POSITIVO.test(String(valor)) || !Number.isSafeInteger(id)) {
      throw new BadRequestError("El id debe ser un entero positivo");
    }
    return id;
  }

  extraerYValidarQuery(query, schema) {
    const resultado = schema.safeParse(query ?? {});
    if (!resultado.success) {
      throw new BadRequestError("Parámetros de consulta inválidos", detallesZod(resultado.error));
    }
    return resultado.data;
  }
}
