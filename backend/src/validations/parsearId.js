import { BadRequestError } from "../errors/AppError.js";

const ENTERO_POSITIVO = /^[1-9]\d*$/;

export function parsearId(valor) {
  const id = Number(valor);
  if (!ENTERO_POSITIVO.test(String(valor)) || !Number.isSafeInteger(id)) {
    throw new BadRequestError("El id debe ser un entero positivo");
  }
  return id;
}
