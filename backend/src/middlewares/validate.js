import { BadRequestError } from "../errors/AppError.js";
import { detallesZod } from "../validations/detallesZod.js";

export function validate(schema) {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req.body ?? {});
    if (!resultado.success) {
      return next(new BadRequestError("Datos inválidos", detallesZod(resultado.error)));
    }
    req.body = resultado.data;
    next();
  };
}
