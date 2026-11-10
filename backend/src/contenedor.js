import { relojSistema } from "./config/reloj.js";
import { UsuarioRepository } from "./repositories/UsuarioRepository.js";
import { CategoriaRepository } from "./repositories/CategoriaRepository.js";
import { EventoRepository } from "./repositories/EventoRepository.js";
import { CompraRepository } from "./repositories/CompraRepository.js";
import { ReseniaRepository } from "./repositories/ReseniaRepository.js";
import { sembrar } from "./seeds/sembrar.js";

export function crearContenedor({ reloj = relojSistema } = {}) {
  const repos = {
    usuarioRepository: new UsuarioRepository(),
    categoriaRepository: new CategoriaRepository(),
    eventoRepository: new EventoRepository(),
    compraRepository: new CompraRepository(),
    reseniaRepository: new ReseniaRepository(),
  };
  const servicios = {};

  async function resetear() {
    await Promise.all(Object.values(repos).map((repo) => repo.clear()));
    await sembrar(repos, reloj);
  }

  return { reloj, repos, servicios, resetear };
}
