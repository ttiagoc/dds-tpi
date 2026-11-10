import { UnauthorizedError } from "../errors/AppError.js";

export const MENSAJE_SIN_SESION = "Necesitás iniciar sesión";

const PREFIJO = "Bearer ";

function extraerToken(req) {
  const header = req.headers?.authorization;
  return typeof header === "string" && header.startsWith(PREFIJO)
    ? header.slice(PREFIJO.length)
    : null;
}

async function identificar(authService, token, req) {
  const usuario = await authService.usuarioDesdeToken(token);
  req.usuario = { id: usuario.id, rol: usuario.rol };
}

export function crearAutenticar(authService) {
  return async (req, _res, next) => {
    const token = extraerToken(req);
    if (!token) return next(new UnauthorizedError(MENSAJE_SIN_SESION));
    try {
      await identificar(authService, token, req);
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function crearAutenticarOpcional(authService) {
  return async (req, _res, next) => {
    const token = extraerToken(req);
    if (!token) return next();
    try {
      await identificar(authService, token, req);
      return next();
    } catch (error) {
      return error instanceof UnauthorizedError ? next() : next(error);
    }
  };
}
