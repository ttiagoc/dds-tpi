import { relojSistema } from "../config/reloj.js";
import { notificadorNulo } from "../sockets/notificador.js";
import { buscarCompraDelParticipante } from "./compras.js";

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

  async listar(compraId, usuario) {
    const compra = await buscarCompraDelParticipante(this.compraRepository, compraId, usuario.id);
    return [...compra.mensajes].sort(cronologico).map((mensaje) => this.toResponse(mensaje));
  }

  async enviar(compraId, { mensaje: texto }, usuario) {
    const compra = await buscarCompraDelParticipante(this.compraRepository, compraId, usuario.id);
    const autor = await this.usuarioRepository.findById(usuario.id);
    const mensaje = this.toResponse(compra.agregarMensaje(autor, texto, this.reloj.ahora()));
    await this.compraRepository.save(compra);
    this.notificador.mensajeNuevo(compra.id, mensaje);
    return mensaje;
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
