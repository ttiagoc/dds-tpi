import { jest } from "@jest/globals";
import { CompraService } from "../../src/services/CompraService.js";
import { AHORA, crearComprador, crearOrganizador } from "./domainFactories.js";

export const ana = crearComprador();
export const bruno = crearComprador({
  id: 4,
  nombre: "Bruno",
  apellido: "Gómez",
  email: "b@x.com",
});
export const fenix = crearOrganizador();
export const konex = crearOrganizador({ id: 5, nombre: "Konex", email: "konex@aiticket.com" });

export const usuarioRepositoryFake = () => ({
  findById: jest.fn(async (id) => [ana, bruno, fenix, konex].find((u) => u.id === id) ?? null),
});

const comoUsuario = (usuario) => ({ id: usuario.id, rol: usuario.rol });
export const usuarioAna = comoUsuario(ana);
export const usuarioBruno = comoUsuario(bruno);
export const usuarioFenix = comoUsuario(fenix);
export const usuarioKonex = comoUsuario(konex);

export const notificadorFake = () => ({ mensajeNuevo: jest.fn(), estadoCompra: jest.fn() });

export function servicioDeCompras(datos) {
  const repos = reposDeCompras(datos);
  const reloj = { ahora: jest.fn(() => AHORA) };
  const notificador = notificadorFake();
  return {
    repos,
    reloj,
    notificador,
    service: new CompraService({ ...repos, reloj, notificador }),
  };
}

function reposDeCompras(datos) {
  const compras = () => datos().compras;
  const eventos = () => datos().eventos;
  const resenias = () => datos().resenias;
  return {
    compraRepository: {
      findById: jest.fn(async (id) => compras().find((c) => c.id === id) ?? null),
      findByComprador: jest.fn(async (id) => compras().filter((c) => c.esDe(id))),
      findByEvento: jest.fn(async (id) => compras().filter((c) => c.evento.id === id)),
      save: jest.fn(async (compra) => {
        compra.id ??= 99;
        return compra;
      }),
    },
    eventoRepository: {
      findById: jest.fn(async (id) => eventos().find((e) => e.id === id) ?? null),
      save: jest.fn(async (evento) => evento),
    },
    usuarioRepository: usuarioRepositoryFake(),
    reseniaRepository: {
      findByCompraId: jest.fn(async (id) => resenias().find((r) => r.compraId === id) ?? null),
      findByComprador: jest.fn(async () => [...resenias()]),
    },
  };
}
