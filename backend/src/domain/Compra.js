import { EstadoCompra, TRANSICIONES } from "./EstadoCompra.js";
import { CambioEstadoCompra } from "./CambioEstadoCompra.js";
import { Entrada } from "./Entrada.js";
import { Mensaje } from "./Mensaje.js";
import { NotFoundError } from "../errors/AppError.js";
import { exigir, esEnteroPositivo, fechaValida } from "./validaciones.js";

const DIA_EN_MS = 24 * 60 * 60 * 1000;
const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

export class Compra {
  #estado;

  constructor({
    id = null,
    comprador,
    evento,
    tipoEntradaId,
    cantidad,
    total,
    estado = PENDIENTE,
    historial = [],
    mensajes = [],
    lecturas = {},
    fechaCompra,
    entradas,
  }) {
    exigir(comprador, "La compra necesita un comprador");
    exigir(evento, "La compra necesita un evento");
    exigir(esEnteroPositivo(cantidad), "La cantidad tiene que ser un entero mayor a 0");
    exigir(Object.values(EstadoCompra).includes(estado), "El estado de la compra no es válido");
    const tipo = evento.tipoEntrada(tipoEntradaId);

    this.id = id;
    this.comprador = comprador;
    this.evento = evento;
    this.tipoEntradaId = tipoEntradaId;
    this.cantidad = cantidad;
    this.total = total ?? tipo.precio * cantidad;
    this.#estado = estado;
    this.historial = historial.map((cambio) => new CambioEstadoCompra(cambio));
    this.mensajes = mensajes.map((mensaje) => new Mensaje(mensaje));
    this.lecturas = { ...lecturas };
    this.fechaCompra = fechaValida(fechaCompra, "La fecha de compra no es válida");
    this.entradas = entradas
      ? entradas.map((entrada) => new Entrada(entrada))
      : Entrada.paraCompra(cantidad);
    exigir(
      this.entradas.length === cantidad,
      "Las entradas no coinciden con la cantidad de la compra",
    );
  }

  static crear({ comprador, evento, tipoEntradaId, cantidad }, ahora) {
    exigir(comprador?.esComprador?.(), "Solo un comprador puede comprar entradas");
    exigir(!evento.yaOcurrio(ahora), "No podés comprar entradas de un evento que ya ocurrió");
    const compra = new Compra({
      comprador,
      evento,
      tipoEntradaId,
      cantidad,
      historial: [{ estado: PENDIENTE, quien: comprador.id, fechaHora: ahora }],
      fechaCompra: ahora,
    });
    compra.tipoEntrada().reservar(cantidad);
    return compra;
  }

  get estado() {
    return this.#estado;
  }

  tipoEntrada() {
    return this.evento.tipoEntrada(this.tipoEntradaId);
  }

  #actualizarEstado(nuevo, quien, ahora) {
    exigir(
      TRANSICIONES[this.#estado].includes(nuevo),
      `No se puede pasar de ${this.#estado} a ${nuevo}`,
    );
    this.#estado = nuevo;
    this.historial.push(new CambioEstadoCompra({ estado: nuevo, quien, fechaHora: ahora }));
  }

  pagar(quien, ahora) {
    if (this.estado === PENDIENTE) {
      exigir(
        !this.evento.yaOcurrio(ahora),
        "No podés pagar una compra de un evento que ya ocurrió",
      );
    }
    this.#actualizarEstado(CONFIRMADA, quien, ahora);
  }

  cancelar(quien, ahora) {
    exigir(this.estado !== UTILIZADA, "No podés cancelar una compra utilizada");
    exigir(![CANCELADA, REEMBOLSADA].includes(this.estado), "La compra ya está cancelada");
    exigir(
      !this.evento.yaOcurrio(ahora),
      "No podés cancelar una compra de un evento que ya ocurrió",
    );
    const estadoPrevio = this.estado;
    this.#actualizarEstado(CANCELADA, quien, ahora);
    this.tipoEntrada().liberar(this.cantidad);
    if (estadoPrevio === CONFIRMADA) this.#actualizarEstado(REEMBOLSADA, quien, ahora);
  }

  marcarUtilizada(quien, ahora) {
    this.#actualizarEstado(UTILIZADA, quien, ahora);
    this.entradas.filter((entrada) => !entrada.estaUsada()).forEach((e) => e.usar(ahora));
  }

  validarEntrada(numero, quien, ahora) {
    exigir(this.estado !== PENDIENTE, "La compra todavía no está pagada");
    exigir(![CANCELADA, REEMBOLSADA].includes(this.estado), "La compra está cancelada");
    this.#entrada(numero).usar(ahora);
    if (this.estado === CONFIRMADA) this.#actualizarEstado(UTILIZADA, quien, ahora);
  }

  #entrada(numero) {
    const entrada = this.entradas.find((e) => e.numero === numero);
    if (!entrada) throw new NotFoundError("No existe la entrada");
    return entrada;
  }

  entradasPara(usuarioId) {
    const puedeValidar = this.evento.esDe(usuarioId) && this.sumaAlRecaudado();
    return this.entradas.map((entrada) => ({
      numero: entrada.numero,
      fechaUso: entrada.fechaUso,
      puedeValidarse: puedeValidar && !entrada.estaUsada(),
    }));
  }

  puedePagarse(ahora) {
    return this.estado === PENDIENTE && !this.evento.yaOcurrio(ahora);
  }

  puedeCancelarse(ahora) {
    return [PENDIENTE, CONFIRMADA].includes(this.estado) && !this.evento.yaOcurrio(ahora);
  }

  puedeMarcarseUtilizada() {
    return this.estado === CONFIRMADA;
  }

  puedeReseniarse() {
    return this.estado === UTILIZADA;
  }

  sumaAlRecaudado() {
    return [CONFIRMADA, UTILIZADA].includes(this.estado);
  }

  accionesPara(usuarioId, ahora) {
    const esComprador = this.esDe(usuarioId);
    return {
      puedePagar: esComprador && this.puedePagarse(ahora),
      puedeCancelar: esComprador && this.puedeCancelarse(ahora),
      puedeMarcarUtilizada: this.evento.esDe(usuarioId) && this.puedeMarcarseUtilizada(),
      puedeReseniar: esComprador && this.puedeReseniarse(),
    };
  }

  diasRestantes(ahora) {
    if (this.estado !== CONFIRMADA) return null;
    const restante = this.evento.fecha.getTime() - ahora.getTime();
    return Math.max(0, Math.ceil(restante / DIA_EN_MS));
  }

  esDe(usuarioId) {
    return this.comprador.id === usuarioId;
  }

  participa(usuarioId) {
    return this.esDe(usuarioId) || this.evento.esDe(usuarioId);
  }

  agregarMensaje(usuario, texto, ahora) {
    const mensaje = new Mensaje({
      id: this.mensajes.length + 1,
      usuario: { id: usuario.id, nombre: usuario.nombreCompleto(), rol: usuario.rol },
      mensaje: texto,
      enviado: ahora,
    });
    this.mensajes.push(mensaje);
    this.lecturas[usuario.id] = mensaje.id;
    return mensaje;
  }

  ultimoMensaje() {
    return this.mensajes.reduce((ultimo, m) => (ultimo && ultimo.id > m.id ? ultimo : m), null);
  }

  marcarLeido(usuarioId) {
    this.lecturas[usuarioId] = this.ultimoMensaje()?.id ?? 0;
  }

  noLeidosPara(usuarioId) {
    const leidoHasta = this.lecturas[usuarioId] ?? 0;
    return this.mensajes.filter((m) => m.usuario.id !== usuarioId && m.id > leidoHasta).length;
  }

  contraparteDe(usuarioId) {
    return this.esDe(usuarioId) ? this.evento.organizador : this.comprador;
  }
}
