import { normalizarError } from "../errors/normalizarError.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, _req, res, _next) {
  const { statusCode, status, message, details, timestamp } = normalizarError(error);
  const cuerpo = { status, message, timestamp };
  if (details !== undefined) cuerpo.details = details;
  res.status(statusCode).json(cuerpo);
}
