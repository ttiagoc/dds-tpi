import { NotFoundError } from "../errors/AppError.js";
import { Evento } from "../domain/Evento.js";
import { errorDeCampo } from "../domain/validaciones.js";
import {
  GeocodificadorNoDisponible,
  GeorefGeocodificador,
  ubicarOFallar,
} from "./geocodificacion/GeorefGeocodificador.js";
import { Resenia } from "../domain/Resenia.js";
import { Rol } from "../domain/Rol.js";
import { relojSistema } from "../config/reloj.js";
import { paginar } from "./paginacion.js";
import { MENSAJE_CATEGORIA_INEXISTENTE, MENSAJE_EVENTO_INEXISTENTE } from "../errors/mensajes.js";

const CRITERIOS = {
  fecha: (evento) => evento.fecha.getTime(),
  precio: (evento) => evento.precioMinimo(),
  puntaje: (evento, puntajes) => puntajes.get(evento.organizador.id) ?? null,
};

function compararValores(a, b, signo) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * signo;
}

function ordenar(eventos, { ordenarPor, orden }, puntajes) {
  const valor = (evento) => CRITERIOS[ordenarPor](evento, puntajes);
  const signo = orden === "desc" ? -1 : 1;
  return [...eventos].sort(
    (a, b) => compararValores(valor(a), valor(b), signo) || Evento.compararPorFecha(a, b),
  );
}

function agruparPorOrganizador(resenias) {
  const grupos = new Map();
  for (const resenia of resenias) {
    const id = resenia.evento.organizador.id;
    grupos.set(id, [...(grupos.get(id) ?? []), resenia]);
  }
  return grupos;
}

function recaudadoPorEvento(compras) {
  const recaudado = new Map();
  for (const compra of compras.filter((c) => c.sumaAlRecaudado())) {
    const id = compra.evento.id;
    recaudado.set(id, (recaudado.get(id) ?? 0) + compra.total);
  }
  return recaudado;
}

export class EventoService {
  constructor({
    eventoRepository,
    reseniaRepository,
    usuarioRepository,
    categoriaRepository,
    compraRepository,
    geocodificador = new GeorefGeocodificador(),
    reloj = relojSistema,
  }) {
    this.eventoRepository = eventoRepository;
    this.reseniaRepository = reseniaRepository;
    this.usuarioRepository = usuarioRepository;
    this.categoriaRepository = categoriaRepository;
    this.compraRepository = compraRepository;
    this.geocodificador = geocodificador;
    this.reloj = reloj;
  }

  async buscar(query, usuario) {
    const eventos = await this.eventoRepository.buscar(query, this.reloj.ahora());
    const puntajes = await this.puntajesPorOrganizador();
    const { items, ...pagina } = paginar(ordenar(eventos, query, puntajes), query);
    return { eventos: await this.resumenes(items, usuario, puntajes), ...pagina };
  }

  async resumenes(eventos, usuario, puntajes = null) {
    const porOrganizador = puntajes ?? (await this.puntajesPorOrganizador());
    const esFavorito = await this.favoritosDe(usuario);
    return eventos.map((evento) =>
      this.toResumen(evento, {
        puntajePromedio: porOrganizador.get(evento.organizador.id) ?? null,
        esFavorito: esFavorito(evento.id),
      }),
    );
  }

  async obtener(id, usuario) {
    const evento = await this.eventoRepository.findById(id);
    if (!evento) throw new NotFoundError(MENSAJE_EVENTO_INEXISTENTE);
    const esFavorito = await this.favoritosDe(usuario);
    return this.toDetalle(evento, {
      puntajePromedio: await this.puntajeDe(evento.organizador.id),
      esFavorito: esFavorito(evento.id),
    });
  }

  async crear({ categoriaId, ...datos }, usuario) {
    const categoria = await this.categoriaRepository.findById(categoriaId);
    if (!categoria) throw errorDeCampo("categoriaId", MENSAJE_CATEGORIA_INEXISTENTE);
    const organizador = await this.usuarioRepository.findById(usuario.id);
    const evento = Evento.crear({ ...datos, categoria, organizador }, this.reloj.ahora());
    evento.ubicarEn(await this.geocodificar(evento.direccion));
    await this.eventoRepository.save(evento);
    return this.toDetalle(evento, {
      puntajePromedio: await this.puntajeDe(organizador.id),
      esFavorito: false,
    });
  }

  async geocodificar(direccion) {
    try {
      return await ubicarOFallar(this.geocodificador, direccion);
    } catch (error) {
      if (!(error instanceof GeocodificadorNoDisponible)) throw error;
      console.warn(`Evento sin ubicación: ${error.message}`);
      return null;
    }
  }

  async listarDelOrganizador(usuario, paginacion) {
    const eventos = await this.eventoRepository.findByOrganizador(usuario.id);
    const recaudado = recaudadoPorEvento(await this.compraRepository.findByOrganizador(usuario.id));
    const puntajePromedio = await this.puntajeDe(usuario.id);
    const { items, ...pagina } = paginar([...eventos].sort(Evento.compararPorFecha), paginacion);
    const resumen = {
      recaudado: [...recaudado.values()].reduce((suma, monto) => suma + monto, 0),
      vendidas: eventos.reduce((suma, evento) => suma + evento.totalVendidas(), 0),
    };
    const resumenes = items.map((evento) => ({
      ...this.toResumen(evento, { puntajePromedio, esFavorito: false }),
      vendidas: evento.totalVendidas(),
      cupo: evento.cupoTotal(),
      recaudado: recaudado.get(evento.id) ?? 0,
    }));
    return { eventos: resumenes, ...pagina, resumen };
  }

  async puntajeDe(organizadorId) {
    return Resenia.promedio(await this.reseniaRepository.findByOrganizador(organizadorId));
  }

  async puntajesPorOrganizador() {
    const grupos = agruparPorOrganizador(await this.reseniaRepository.findAll());
    return new Map([...grupos].map(([id, resenias]) => [id, Resenia.promedio(resenias)]));
  }

  async favoritosDe(usuario) {
    if (usuario?.rol !== Rol.COMPRADOR) return () => false;
    const comprador = await this.usuarioRepository.findById(usuario.id);
    return (eventoId) => comprador?.esFavorito(eventoId) ?? false;
  }

  toResumen(evento, { puntajePromedio, esFavorito }) {
    const { id, nombre, fecha, lugar, categoria, multimedia, organizador } = evento;
    return {
      id,
      nombre,
      fecha: fecha.toISOString(),
      lugar,
      categoria: { id: categoria.id, nombre: categoria.nombre },
      precioDesde: evento.precioMinimo(),
      imagen: multimedia[0] ?? null,
      organizador: { id: organizador.id, nombre: organizador.nombreCompleto(), puntajePromedio },
      esFavorito,
      finalizado: evento.yaOcurrio(this.reloj.ahora()),
    };
  }

  toDetalle(evento, extras) {
    return {
      ...this.toResumen(evento, extras),
      descripcion: evento.descripcion,
      direccion: evento.direccion,
      ubicacion: evento.ubicacion,
      multimedia: [...evento.multimedia],
      tiposEntrada: evento.tiposEntrada.map((tipo) => ({
        id: tipo.id,
        nombre: tipo.nombre,
        descripcion: tipo.descripcion,
        precio: tipo.precio,
        cupo: tipo.cupo,
        disponibles: tipo.disponibles(),
      })),
    };
  }
}
