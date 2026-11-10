function codigoDe(error) {
  if (Number.isInteger(error?.statusCode)) return error.statusCode;
  if (Number.isInteger(error?.status)) return error.status;
  return 500;
}

export function crearErrorLogger({ nodeEnv = process.env.NODE_ENV, consola = console } = {}) {
  return (error, req, _res, next) => {
    if (nodeEnv !== "test") {
      const codigo = codigoDe(error);
      const linea = `${codigo} ${req.method} ${req.originalUrl} - ${error?.message}`;
      if (codigo >= 500) consola.error(linea, error?.stack);
      else consola.warn(linea);
    }
    next(error);
  };
}
