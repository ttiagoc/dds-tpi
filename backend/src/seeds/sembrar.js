import bcrypt from "bcryptjs";
import { Usuario } from "../domain/Usuario.js";
import { Categoria } from "../domain/Categoria.js";
import { Evento } from "../domain/Evento.js";
import { Compra } from "../domain/Compra.js";
import { Resenia } from "../domain/Resenia.js";
import { EstadoCompra } from "../domain/EstadoCompra.js";
import { USUARIOS, CATEGORIAS, EVENTOS, COMPRAS, RESENIAS, FAVORITOS } from "./datos.js";

export const CONTRASENIA_DEMO = "Demo1234!";

const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;
const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } = EstadoCompra;

const RECORRIDOS = {
  [PENDIENTE]: [PENDIENTE],
  [CONFIRMADA]: [PENDIENTE, CONFIRMADA],
  [UTILIZADA]: [PENDIENTE, CONFIRMADA, UTILIZADA],
  [CANCELADA]: [PENDIENTE, CANCELADA],
  [REEMBOLSADA]: [PENDIENTE, CONFIRMADA, CANCELADA, REEMBOLSADA],
};
const OCUPAN_CUPO = [PENDIENTE, CONFIRMADA, UTILIZADA];

let hashDemo;
const obtenerHashDemo = () => (hashDemo ??= bcrypt.hash(CONTRASENIA_DEMO, 10));

const desplazar = (fecha, ms) => new Date(fecha.getTime() + ms);

async function guardarTodos(repo, entidades) {
  for (const entidad of entidades) await repo.save(entidad);
  return entidades;
}

async function guardarPorClave(repo, pares) {
  await guardarTodos(
    repo,
    pares.map(([, entidad]) => entidad),
  );
  return Object.fromEntries(pares);
}

async function sembrarUsuarios(repo) {
  const passwordHash = await obtenerHashDemo();
  return guardarPorClave(
    repo,
    USUARIOS.map(({ clave, ...datos }) => [clave, new Usuario({ ...datos, passwordHash })]),
  );
}

async function sembrarCategorias(repo) {
  return guardarPorClave(
    repo,
    CATEGORIAS.map((datos) => [datos.nombre, new Categoria(datos)]),
  );
}

async function sembrarEventos(repo, { usuarios, categorias, ahora }) {
  return guardarPorClave(
    repo,
    EVENTOS.map(({ clave, enDias, categoria, organizador, ...datos }) => [
      clave,
      new Evento({
        ...datos,
        fecha: desplazar(ahora, enDias * DIA),
        categoria: categorias[categoria],
        organizador: usuarios[organizador],
        multimedia: [`https://picsum.photos/seed/${clave}/800/450`],
      }),
    ]),
  );
}

function momentoDe(estado, { fechaCompra, evento, ahora }) {
  if (estado === PENDIENTE) return fechaCompra;
  if (estado === CONFIRMADA) return desplazar(fechaCompra, HORA);
  if (estado === UTILIZADA) return evento.yaOcurrio(ahora) ? evento.fecha : desplazar(ahora, -HORA);
  return desplazar(fechaCompra, DIA);
}

function armarHistorial(estadoFinal, contexto) {
  const { comprador, evento } = contexto;
  return RECORRIDOS[estadoFinal].map((estado) => ({
    estado,
    quien: estado === UTILIZADA ? evento.organizador.id : comprador.id,
    fechaHora: momentoDe(estado, contexto),
  }));
}

function armarCompra(datos, { usuarios, eventos, ahora }) {
  const comprador = usuarios[datos.comprador];
  const evento = eventos[datos.evento];
  const fechaCompra = desplazar(ahora, -datos.haceDias * DIA);
  const compra = new Compra({
    comprador,
    evento,
    tipoEntradaId: evento.tiposEntrada.find((t) => t.nombre === datos.tipo).id,
    cantidad: datos.cantidad,
    estado: datos.estado,
    historial: armarHistorial(datos.estado, { comprador, evento, fechaCompra, ahora }),
    fechaCompra,
  });
  if (OCUPAN_CUPO.includes(compra.estado)) compra.tipoEntrada().reservar(compra.cantidad);
  for (const { de, haceHoras, texto } of datos.mensajes ?? []) {
    compra.agregarMensaje(usuarios[de], texto, desplazar(ahora, -haceHoras * HORA));
  }
  return compra;
}

async function sembrarCompras(repo, contexto) {
  return guardarPorClave(
    repo,
    COMPRAS.map((datos) => [datos.clave, armarCompra(datos, contexto)]),
  );
}

async function sembrarResenias(repo, { compras, ahora }) {
  const resenias = RESENIAS.map(({ compra: clave, ...datos }) => {
    const compra = compras[clave];
    const uso = compra.historial.at(-1).fechaHora;
    const fecha = new Date(Math.min(uso.getTime() + DIA, ahora.getTime()));
    return Resenia.crear({ compra, ...datos }, fecha);
  });
  await guardarTodos(repo, resenias);
}

function marcarFavoritos({ usuarios, eventos }) {
  for (const [clave, claves] of Object.entries(FAVORITOS)) {
    for (const evento of claves) usuarios[clave].agregarFavorito(eventos[evento].id);
  }
}

export async function sembrar(repos, reloj) {
  const ahora = reloj.ahora();
  const usuarios = await sembrarUsuarios(repos.usuarioRepository);
  const categorias = await sembrarCategorias(repos.categoriaRepository);
  const eventos = await sembrarEventos(repos.eventoRepository, { usuarios, categorias, ahora });
  const compras = await sembrarCompras(repos.compraRepository, { usuarios, eventos, ahora });
  await sembrarResenias(repos.reseniaRepository, { compras, ahora });
  marcarFavoritos({ usuarios, eventos });
}
