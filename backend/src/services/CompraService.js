import { ForbiddenError, NotFoundError } from "../errors/AppError.js";
import { Compra } from "../domain/Compra.js";
import { relojSistema } from "../config/reloj.js";
import {
  MENSAJE_COMPRA_INEXISTENTE,
  MENSAJE_EVENTO_INEXISTENTE,
  MENSAJE_SIN_PERMISO,
} from "../errors/mensajes.js";
import { paginar } from "./paginacion.js";

function ordenarParaElComprador(compras, ahora) {
  const clave = (compra) => {
    const fecha = compra.evento.fecha.getTime();
    return compra.evento.yaOcurrio(ahora) ? [1, -fecha] : [0, fecha];
  };
  return [...compras].sort((a, b) => {
    const [grupoA, fechaA] = clave(a);
    const [grupoB, fechaB] = clave(b);
    return grupoA - grupoB || fechaA - fechaB || a.id - b.id;
  });
}

function ordenarParaElOrganizador(compras) {
  return [...compras].sort((a, b) => b.fechaCompra - a.fechaCompra || b.id - a.id);
}

function disponibilidadDe(evento) {
  return evento.tiposEntrada.map((tipo) => ({
    tipoEntradaId: tipo.id,
    nombre: tipo.nombre,
    cupo: tipo.cupo,
    vendidas: tipo.vendidas,
    disponibles: tipo.disponibles(),
  }));
}

function nombresDeParticipantes(compra) {
  const { comprador, evento } = compra;
  return new Map([
    [comprador.id, comprador.nombreCompleto()],
    [evento.organizador.id, evento.organizador.nombreCompleto()],
  ]);
}

export class CompraService {
  constructor({
    compraRepository,
    eventoRepository,
    usuarioRepository,
    reseniaRepository,
    reloj = relojSistema,
  }) {
    this.compraRepository = compraRepository;
    this.eventoRepository = eventoRepository;
    this.usuarioRepository = usuarioRepository;
    this.reseniaRepository = reseniaRepository;
    this.reloj = reloj;
  }

  async crear({ eventoId, tipoEntradaId, cantidad }, usuario) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError(MENSAJE_EVENTO_INEXISTENTE);
    const comprador = await this.usuarioRepository.findById(usuario.id);
    const ahora = this.reloj.ahora();
    const compra = Compra.crear({ comprador, evento, tipoEntradaId, cantidad }, ahora);
    await this.guardar(compra);
    return this.toDetalle(compra, { usuario, ahora, resenia: null });
  }

  async listarDelComprador(usuario, { estado, ...paginacion }) {
    const ahora = this.reloj.ahora();
    const todas = await this.compraRepository.findByComprador(usuario.id);
    const filtradas = todas.filter((compra) => estado == null || compra.estado === estado);
    const reseniadas = new Set(
      (await this.reseniaRepository.findByComprador(usuario.id)).map((r) => r.compraId),
    );
    const { items, ...pagina } = paginar(ordenarParaElComprador(filtradas, ahora), paginacion);
    const compras = items.map((compra) =>
      this.toResumen(compra, { usuario, ahora, reseniada: reseniadas.has(compra.id) }),
    );
    return { compras, ...pagina };
  }

  async obtener(id, usuario) {
    const compra = await this.buscar(id);
    if (!compra.participa(usuario.id)) throw new ForbiddenError(MENSAJE_SIN_PERMISO);
    return this.detalleConResenia(compra, usuario, this.reloj.ahora());
  }

  async pagar(id, usuario) {
    return this.accionDelComprador(id, usuario, (compra, ahora) => compra.pagar(usuario.id, ahora));
  }

  async cancelar(id, usuario) {
    return this.accionDelComprador(id, usuario, (compra, ahora) =>
      compra.cancelar(usuario.id, ahora),
    );
  }

  async listarDelEvento(eventoId, usuario, { estado, ...paginacion }) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError(MENSAJE_EVENTO_INEXISTENTE);
    if (!evento.esDe(usuario.id)) throw new ForbiddenError(MENSAJE_SIN_PERMISO);
    const ahora = this.reloj.ahora();
    const todas = await this.compraRepository.findByEvento(evento.id);
    const filtradas = todas.filter((compra) => estado == null || compra.estado === estado);
    const { items, ...pagina } = paginar(ordenarParaElOrganizador(filtradas), paginacion);
    return {
      evento: { id: evento.id, nombre: evento.nombre },
      disponibilidad: disponibilidadDe(evento),
      compras: items.map((compra) => this.toResumen(compra, { usuario, ahora, reseniada: false })),
      ...pagina,
    };
  }

  async marcarUtilizada(id, usuario) {
    return this.accion(
      id,
      usuario,
      (compra) => compra.evento.esDe(usuario.id),
      (compra, ahora) => compra.marcarUtilizada(usuario.id, ahora),
    );
  }

  async accionDelComprador(id, usuario, ejecutar) {
    return this.accion(id, usuario, (compra) => compra.esDe(usuario.id), ejecutar);
  }

  async accion(id, usuario, tienePermiso, ejecutar) {
    const compra = await this.buscar(id);
    if (!tienePermiso(compra)) throw new ForbiddenError(MENSAJE_SIN_PERMISO);
    const ahora = this.reloj.ahora();
    ejecutar(compra, ahora);
    await this.guardar(compra);
    return this.detalleConResenia(compra, usuario, ahora);
  }

  async guardar(compra) {
    await this.compraRepository.save(compra);
    await this.eventoRepository.save(compra.evento);
  }

  async buscar(id) {
    const compra = await this.compraRepository.findById(id);
    if (!compra) throw new NotFoundError(MENSAJE_COMPRA_INEXISTENTE);
    return compra;
  }

  async detalleConResenia(compra, usuario, ahora) {
    const resenia = await this.reseniaRepository.findByCompraId(compra.id);
    return this.toDetalle(compra, { usuario, ahora, resenia });
  }

  toResumen(compra, { usuario, ahora, reseniada }) {
    const { id, estado, cantidad, total, fechaCompra, evento, comprador } = compra;
    const tipo = compra.tipoEntrada();
    const acciones = compra.accionesPara(usuario.id, ahora);
    return {
      id,
      estado,
      cantidad,
      total,
      fechaCompra: fechaCompra.toISOString(),
      diasRestantes: compra.diasRestantes(ahora),
      evento: {
        id: evento.id,
        nombre: evento.nombre,
        fecha: evento.fecha.toISOString(),
        lugar: evento.lugar,
        imagen: evento.multimedia[0] ?? null,
      },
      tipoEntrada: { id: tipo.id, nombre: tipo.nombre, precio: tipo.precio },
      comprador: { id: comprador.id, nombre: comprador.nombreCompleto() },
      acciones: { ...acciones, puedeReseniar: acciones.puedeReseniar && !reseniada },
    };
  }

  toDetalle(compra, { usuario, ahora, resenia }) {
    const nombres = nombresDeParticipantes(compra);
    return {
      ...this.toResumen(compra, { usuario, ahora, reseniada: resenia != null }),
      historial: compra.historial.map(({ estado, quien, fechaHora }) => ({
        estado,
        quien: { id: quien, nombre: nombres.get(quien) ?? null },
        fechaHora: fechaHora.toISOString(),
      })),
      resenia: resenia ? { puntuacion: resenia.puntuacion, detalle: resenia.detalle } : null,
    };
  }
}
