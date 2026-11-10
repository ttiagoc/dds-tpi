import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/AppError.js";

export const MENSAJE_CREDENCIALES = "Email o contraseña incorrectos";
export const MENSAJE_SESION_INVALIDA = "Tu sesión expiró o no es válida. Iniciá sesión de nuevo";

const ALGORITMO = "HS256";
const HASH_SIN_USUARIO = "$2b$10$X2b2mqCMTUH4w50KAsdzle7xnmIhjrPrcl57fHY1uZjhx4Tr503ay";

export class AuthService {
  constructor({ usuarioRepository, jwtSecret, jwtExpiresIn = "8h" }) {
    this.usuarioRepository = usuarioRepository;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async login({ email, password }) {
    const usuario = await this.usuarioRepository.findByEmail(email);
    const coincide = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_SIN_USUARIO);
    if (!usuario || !coincide) throw new UnauthorizedError(MENSAJE_CREDENCIALES);
    const token = jwt.sign({ rol: usuario.rol }, this.jwtSecret, {
      algorithm: ALGORITMO,
      subject: String(usuario.id),
      expiresIn: this.jwtExpiresIn,
    });
    return { token, usuario: this.toResponse(usuario) };
  }

  async usuarioDesdeToken(token) {
    let payload;
    try {
      payload = jwt.verify(token, this.jwtSecret, { algorithms: [ALGORITMO] });
    } catch {
      throw new UnauthorizedError(MENSAJE_SESION_INVALIDA);
    }
    return this.buscarUsuario(Number(payload.sub));
  }

  async perfil(id) {
    return this.toResponse(await this.buscarUsuario(id));
  }

  async buscarUsuario(id) {
    const usuario = await this.usuarioRepository.findById(id);
    if (!usuario) throw new UnauthorizedError(MENSAJE_SESION_INVALIDA);
    return usuario;
  }

  toResponse(usuario) {
    const { id, nombre, apellido, email, rol } = usuario;
    return { id, nombre, apellido, email, rol };
  }
}
