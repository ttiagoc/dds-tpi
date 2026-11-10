import { NotFoundError } from "../errors/AppError.js";

export function notFoundHandler(req, _res, next) {
  next(new NotFoundError(`No existe la ruta ${req.method} ${req.path}`));
}
