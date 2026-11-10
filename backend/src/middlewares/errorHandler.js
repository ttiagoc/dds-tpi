import { AppError, BadRequestError } from "../errors/AppError.js";

function normalizar(error) {
  if (error instanceof AppError) return error;
  if (error?.type === "entity.parse.failed") {
    return new BadRequestError("El cuerpo de la solicitud no es un JSON válido");
  }
  return new AppError("Error interno del servidor", 500);
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  const { statusCode, status, message, details, timestamp } = normalizar(error);
  const cuerpo = { status, message, timestamp };
  if (details !== undefined) cuerpo.details = details;
  res.status(statusCode).json(cuerpo);
}
