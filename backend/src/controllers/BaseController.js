import { BadRequestError } from "../errors/AppError.js";
import { detallesZod } from "../validations/detallesZod.js";

export class BaseController {
  parsearId(valor) {
    const id = Number(valor);
    if (valor === "" || !Number.isInteger(id) || id < 1) {
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
