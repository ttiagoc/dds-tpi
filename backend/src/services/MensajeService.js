import { relojSistema } from "../config/reloj.js";
import { notificadorNulo } from "../sockets/notificador.js";
import { buscarCompraDelParticipante } from "./compras.js";
import { MENSAJES_POR_PAGINA } from "../validations/mensajesQueryValidation.js";
import { Rol } from "../domain/Rol.js";
import { paginar } from "./paginacion.js";

const porUltimoMensaje = (a, b) =>
  b.ultimoMensaje().enviado - a.ultimoMensaje().enviado || b.id - a.id;

const cronologico = (a, b) => a.enviado - b.enviado || a.id - b.id;

export class MensajeService {
  constructor({
    compraRepository,
    usuarioRepository,
    reloj = relojSistema,
    notificador = notificadorNulo,
  }) {
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
    this.reloj = reloj;
    this.notificador = notificador;
  }

  async listar(compraId, usuario, { antesDe, limit = MENSAJES_POR_PAGINA } = {}) {
    const compra = await buscarCompraDelParticipante(this.compraRepository, compraId, usuario.id);
    const anteriores = compra.mensajes.filter((mensaje) => antesDe == null || mensaje.id < antesDe);
    const pagina = [...anteriores].sort(cronologico).slice(-limit);
    return {
      mensajes: pagina.map((mensaje) => this.toResponse(mensaje)),
      hayMas: anteriores.length > limit,
    };
  }

  async enviar(compraId, { mensaje: texto }, usuario) {
    const compra = await buscarCompraDelParticipante(this.compraRepository, compraId, usuario.id);
    const autor = await this.usuarioRepository.findById(usuario.id);
    const mensaje = this.toResponse(compra.agregarMensaje(autor, texto, this.reloj.ahora()));
    await this.compraRepository.save(compra);
    this.notificador.mensajeNuevo(compra.id, mensaje);
    const contraparte = compra.contraparteDe(usuario.id);
    this.notificador.conversacionActualizada(contraparte.id, {
      compraId: compra.id,
      ultimoMensaje: mensaje,
      noLeidos: compra.noLeidosPara(contraparte.id),
    });
    return mensaje;
  }

  async listarConversaciones(usuario, paginacion) {
    const compras = await this.comprasDe(usuario);
    const conMensajes = compras.filter((compra) => compra.ultimoMensaje()).sort(porUltimoMensaje);
    const totalNoLeidos = conMensajes.reduce((suma, c) => suma + c.noLeidosPara(usuario.id), 0);
    const { items, ...pagina } = paginar(conMensajes, paginacion);
    return {
      conversaciones: items.map((compra) => this.toConversacion(compra, usuario.id)),
      ...pagina,
      totalNoLeidos,
    };
  }

  async marcarLeidos(compraId, usuario) {
    const compra = await buscarCompraDelParticipante(this.compraRepository, compraId, usuario.id);
    compra.marcarLeido(usuario.id);
    await this.compraRepository.save(compra);
  }

  comprasDe(usuario) {
    return usuario.rol === Rol.ORGANIZADOR
      ? this.compraRepository.findByOrganizador(usuario.id)
      : this.compraRepository.findByComprador(usuario.id);
  }

  toConversacion(compra, usuarioId) {
    const { evento } = compra;
    const contraparte = compra.contraparteDe(usuarioId);
    return {
      compraId: compra.id,
      estado: compra.estado,
      evento: { id: evento.id, nombre: evento.nombre, imagen: evento.multimedia[0] ?? null },
      contraparte: { id: contraparte.id, nombre: contraparte.nombreCompleto() },
      ultimoMensaje: this.toResponse(compra.ultimoMensaje()),
      noLeidos: compra.noLeidosPara(usuarioId),
    };
  }

  async verificarParticipante(compraId, usuario) {
    await buscarCompraDelParticipante(this.compraRepository, compraId, usuario.id);
  }

  toResponse({ id, usuario, mensaje, enviado }) {
    return {
      id,
      usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol },
      mensaje,
      enviado: enviado.toISOString(),
    };
  }
}
