import { ForbiddenError, UnauthorizedError } from "../errors/AppError.js";
import { MENSAJE_SIN_SESION } from "./autenticar.js";
import { MENSAJE_SIN_PERMISO } from "../errors/mensajes.js";

export function autorizar(...roles) {
  return (req, _res, next) => {
    if (!req.usuario) return next(new UnauthorizedError(MENSAJE_SIN_SESION));
    if (!roles.includes(req.usuario.rol)) return next(new ForbiddenError(MENSAJE_SIN_PERMISO));
    return next();
  };
}
