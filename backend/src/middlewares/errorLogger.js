import { normalizarError } from "../errors/normalizarError.js";

export function crearErrorLogger({ nodeEnv = process.env.NODE_ENV, consola = console } = {}) {
  return (error, req, _res, next) => {
    if (nodeEnv !== "test") {
      const { statusCode } = normalizarError(error);
      const linea = `${statusCode} ${req.method} ${req.originalUrl} - ${error?.message}`;
      if (statusCode >= 500) consola.error(linea, error?.stack);
      else consola.warn(linea);
    }
    next(error);
  };
}
