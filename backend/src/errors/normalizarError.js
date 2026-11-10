import { AppError, BadRequestError } from "./AppError.js";

export function normalizarError(error) {
  if (error instanceof AppError) return error;
  if (error?.type === "entity.parse.failed") {
    return new BadRequestError("El cuerpo de la solicitud no es un JSON válido");
  }
  return new AppError("Error interno del servidor", 500);
}
