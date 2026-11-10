import { relojSistema } from "./config/reloj.js";
import { leerEntorno } from "./config/entorno.js";
import { UsuarioRepository } from "./repositories/UsuarioRepository.js";
import { CategoriaRepository } from "./repositories/CategoriaRepository.js";
import { EventoRepository } from "./repositories/EventoRepository.js";
import { CompraRepository } from "./repositories/CompraRepository.js";
import { ReseniaRepository } from "./repositories/ReseniaRepository.js";
import { AuthService } from "./services/AuthService.js";
import { EventoService } from "./services/EventoService.js";
import { CategoriaService } from "./services/CategoriaService.js";
import { CompraService } from "./services/CompraService.js";
import { ReseniaService } from "./services/ReseniaService.js";
import { FavoritoService } from "./services/FavoritoService.js";
import { MensajeService } from "./services/MensajeService.js";
import { sembrar } from "./seeds/sembrar.js";
import { notificadorNulo } from "./sockets/notificador.js";

function crearRepos() {
  return {
    usuarioRepository: new UsuarioRepository(),
    categoriaRepository: new CategoriaRepository(),
    eventoRepository: new EventoRepository(),
    compraRepository: new CompraRepository(),
    reseniaRepository: new ReseniaRepository(),
  };
}

function crearServiciosDeCompras(repos, { reloj, notificador }) {
  const { compraRepository, eventoRepository, usuarioRepository, reseniaRepository } = repos;
  return {
    compraService: new CompraService({
      compraRepository,
      eventoRepository,
      usuarioRepository,
      reseniaRepository,
      reloj,
      notificador,
    }),
    reseniaService: new ReseniaService({
      compraRepository,
      reseniaRepository,
      usuarioRepository,
      reloj,
    }),
    mensajeService: new MensajeService({
      compraRepository,
      usuarioRepository,
      reloj,
      notificador,
    }),
  };
}

function crearServicios(repos, { reloj, entorno, notificador }) {
  const servicios = {
    authService: new AuthService({
      usuarioRepository: repos.usuarioRepository,
      jwtSecret: entorno.jwtSecret,
      jwtExpiresIn: entorno.jwtExpiresIn,
    }),
    eventoService: new EventoService({
      eventoRepository: repos.eventoRepository,
      reseniaRepository: repos.reseniaRepository,
      usuarioRepository: repos.usuarioRepository,
      categoriaRepository: repos.categoriaRepository,
      compraRepository: repos.compraRepository,
      reloj,
    }),
    categoriaService: new CategoriaService({ categoriaRepository: repos.categoriaRepository }),
    ...crearServiciosDeCompras(repos, { reloj, notificador }),
  };
  servicios.favoritoService = new FavoritoService({
    usuarioRepository: repos.usuarioRepository,
    eventoRepository: repos.eventoRepository,
    eventoService: servicios.eventoService,
  });
  return servicios;
}

export function crearContenedor({
  reloj = relojSistema,
  entorno = leerEntorno(),
  notificador = notificadorNulo,
} = {}) {
  const repos = crearRepos();
  const servicios = crearServicios(repos, { reloj, entorno, notificador });

  async function resetear() {
    await Promise.all(Object.values(repos).map((repo) => repo.clear()));
    await sembrar(repos, reloj);
  }

  return { reloj, repos, servicios, resetear };
}
