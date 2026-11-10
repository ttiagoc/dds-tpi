import { NotFoundError } from "../errors/AppError.js";
import { Resenia } from "../domain/Resenia.js";
import { Rol } from "../domain/Rol.js";
import { relojSistema } from "../config/reloj.js";

export const MENSAJE_EVENTO_INEXISTENTE = "No existe el evento";

const CRITERIOS = {
  fecha: (evento) => evento.fecha.getTime(),
  precio: (evento) => evento.precioMinimo(),
  puntaje: (evento, puntajes) => puntajes.get(evento.organizador.id) ?? null,
};

const desempate = (a, b) => a.fecha.getTime() - b.fecha.getTime() || a.id - b.id;

function compararValores(a, b, signo) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * signo;
}

function ordenar(eventos, { ordenarPor, orden }, puntajes) {
  const valor = (evento) => CRITERIOS[ordenarPor](evento, puntajes);
  const signo = orden === "desc" ? -1 : 1;
  return [...eventos].sort((a, b) => compararValores(valor(a), valor(b), signo) || desempate(a, b));
}

function paginar(lista, { page, limit }) {
  return {
    items: lista.slice((page - 1) * limit, page * limit),
    total: lista.length,
    page,
    totalPages: Math.ceil(lista.length / limit),
  };
}

function agruparPorOrganizador(resenias) {
  const grupos = new Map();
  for (const resenia of resenias) {
    const id = resenia.evento.organizador.id;
    grupos.set(id, [...(grupos.get(id) ?? []), resenia]);
  }
  return grupos;
}

export class EventoService {
  constructor({ eventoRepository, reseniaRepository, usuarioRepository, reloj = relojSistema }) {
    this.eventoRepository = eventoRepository;
    this.reseniaRepository = reseniaRepository;
    this.usuarioRepository = usuarioRepository;
    this.reloj = reloj;
  }

  async buscar(query, usuario) {
    const eventos = await this.eventoRepository.buscar(query, this.reloj.ahora());
    const puntajes = await this.puntajesPorOrganizador();
    const esFavorito = await this.favoritosDe(usuario);
    const { items, ...pagina } = paginar(ordenar(eventos, query, puntajes), query);
    const resumenes = items.map((evento) =>
      this.toResumen(evento, {
        puntajePromedio: puntajes.get(evento.organizador.id) ?? null,
        esFavorito: esFavorito(evento.id),
      }),
    );
    return { eventos: resumenes, ...pagina };
  }

  async obtener(id, usuario) {
    const evento = await this.eventoRepository.findById(id);
    if (!evento) throw new NotFoundError(MENSAJE_EVENTO_INEXISTENTE);
    const resenias = await this.reseniaRepository.findByOrganizador(evento.organizador.id);
    const esFavorito = await this.favoritosDe(usuario);
    return this.toDetalle(evento, {
      puntajePromedio: Resenia.promedio(resenias),
      esFavorito: esFavorito(evento.id),
    });
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
    };
  }

  toDetalle(evento, extras) {
    return {
      ...this.toResumen(evento, extras),
      descripcion: evento.descripcion,
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
