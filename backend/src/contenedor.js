import { relojSistema } from "./config/reloj.js";
import { leerEntorno } from "./config/entorno.js";
import { UsuarioRepository } from "./repositories/UsuarioRepository.js";
import { CategoriaRepository } from "./repositories/CategoriaRepository.js";
import { EventoRepository } from "./repositories/EventoRepository.js";
import { CompraRepository } from "./repositories/CompraRepository.js";
import { ReseniaRepository } from "./repositories/ReseniaRepository.js";
import { AuthService } from "./services/AuthService.js";
import { sembrar } from "./seeds/sembrar.js";

export function crearContenedor({ reloj = relojSistema, entorno = leerEntorno() } = {}) {
  const repos = {
    usuarioRepository: new UsuarioRepository(),
    categoriaRepository: new CategoriaRepository(),
    eventoRepository: new EventoRepository(),
    compraRepository: new CompraRepository(),
    reseniaRepository: new ReseniaRepository(),
  };
  const servicios = {
    authService: new AuthService({
      usuarioRepository: repos.usuarioRepository,
      jwtSecret: entorno.jwtSecret,
      jwtExpiresIn: entorno.jwtExpiresIn,
    }),
  };

  async function resetear() {
    await Promise.all(Object.values(repos).map((repo) => repo.clear()));
    await sembrar(repos, reloj);
  }

  return { reloj, repos, servicios, resetear };
}
