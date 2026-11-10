import { Usuario } from "../../src/domain/Usuario.js";
import { Categoria } from "../../src/domain/Categoria.js";
import { TipoEntrada } from "../../src/domain/TipoEntrada.js";
import { Evento } from "../../src/domain/Evento.js";
import { Compra } from "../../src/domain/Compra.js";
import { Rol } from "../../src/domain/Rol.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";

export const AHORA = new Date("2026-11-15T12:00:00.000Z");
export const DIA = 24 * 60 * 60 * 1000;
export const enDias = (dias) => new Date(AHORA.getTime() + dias * DIA);

export function crearComprador(overrides = {}) {
  return new Usuario({
    id: 3,
    nombre: "Ana",
    apellido: "Pérez",
    email: "ana@aiticket.com",
    passwordHash: "hash",
    rol: Rol.COMPRADOR,
    ...overrides,
  });
}

export function crearOrganizador(overrides = {}) {
  return new Usuario({
    id: 2,
    nombre: "Fénix Producciones",
    email: "fenix@aiticket.com",
    passwordHash: "hash",
    rol: Rol.ORGANIZADOR,
    ...overrides,
  });
}

export function crearCategoria(overrides = {}) {
  return new Categoria({ id: 1, nombre: "Recitales", descripcion: "Música en vivo", ...overrides });
}

export function crearTipoEntrada(overrides = {}) {
  return new TipoEntrada({ id: 1, nombre: "Campo", precio: 45000, cupo: 10, ...overrides });
}

export function datosEvento(overrides = {}) {
  return {
    id: 1,
    nombre: "Los Piojos en River",
    descripcion: "Vuelven los Piojos",
    categoria: crearCategoria(),
    fecha: enDias(12),
    lugar: "Estadio River Plate",
    tiposEntrada: [
      { id: 1, nombre: "Campo", precio: 45000, cupo: 10 },
      { id: 2, nombre: "Platea", precio: 80000, cupo: 5 },
    ],
    organizador: crearOrganizador(),
    ...overrides,
  };
}

export function crearEvento(overrides = {}) {
  return new Evento(datosEvento(overrides));
}

export const tipoEntradaBody = (overrides = {}) => ({
  nombre: "General",
  precio: 15000,
  cupo: 200,
  ...overrides,
});

export function bodyEvento(overrides = {}) {
  return {
    nombre: "Stand-up en el Konex",
    descripcion: "Cuatro comediantes, una noche",
    categoriaId: 6,
    fecha: enDias(20).toISOString(),
    lugar: "Ciudad Cultural Konex",
    multimedia: ["https://img/standup.jpg"],
    tiposEntrada: [
      tipoEntradaBody({ descripcion: "De pie" }),
      tipoEntradaBody({ nombre: "VIP", precio: 30000, cupo: 20 }),
    ],
    ...overrides,
  };
}

const PASOS = {
  [EstadoCompra.PENDIENTE]: [],
  [EstadoCompra.CONFIRMADA]: ["pagar"],
  [EstadoCompra.UTILIZADA]: ["pagar", "marcarUtilizada"],
  [EstadoCompra.CANCELADA]: ["cancelar"],
  [EstadoCompra.REEMBOLSADA]: ["pagar", "cancelar"],
};

export function crearCompra({
  estado = EstadoCompra.PENDIENTE,
  comprador = crearComprador(),
  evento = crearEvento(),
  tipoEntradaId = 1,
  cantidad = 2,
  id = 7,
} = {}) {
  const compra = Compra.crear({ comprador, evento, tipoEntradaId, cantidad }, AHORA);
  compra.id = id;
  for (const paso of PASOS[estado]) {
    const quien = paso === "marcarUtilizada" ? evento.organizador.id : comprador.id;
    compra[paso](quien, AHORA);
  }
  return compra;
}
