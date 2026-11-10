import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { MensajeService } from "../../src/services/MensajeService.js";
import { MENSAJE_COMPRA_INEXISTENTE, MENSAJE_SIN_PERMISO } from "../../src/errors/mensajes.js";
import { ForbiddenError, NotFoundError } from "../../src/errors/AppError.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import { AHORA, crearComprador, crearCompra } from "../helpers/domainFactories.js";
import {
  ana,
  fenix,
  usuarioAna,
  usuarioBruno,
  usuarioFenix,
  usuarioKonex,
  usuarioRepositoryFake,
} from "../helpers/comprasFake.js";

const DESPUES = new Date(AHORA.getTime() + 60_000);

let compras;
let repos;
let reloj;
let notificador;
let service;

const compraDeAna = (estado = EstadoCompra.CONFIRMADA) =>
  crearCompra({ id: 7, estado, comprador: ana });

beforeEach(() => {
  compras = [];
  repos = {
    compraRepository: {
      findById: jest.fn(async (id) => compras.find((c) => c.id === id) ?? null),
      save: jest.fn(async (compra) => compra),
    },
    usuarioRepository: usuarioRepositoryFake(),
  };
  reloj = { ahora: jest.fn(() => DESPUES) };
  notificador = { mensajeNuevo: jest.fn() };
  service = new MensajeService({ ...repos, reloj, notificador });
});

describe("MensajeService.listar", () => {
  it("devuelve los mensajes en orden cronológico con la forma del contrato", async () => {
    const compra = compraDeAna();
    compra.agregarMensaje(ana, "¿A qué hora abren?", AHORA);
    compra.agregarMensaje(fenix, "A las 17 h", DESPUES);
    compras = [compra];
    expect(await service.listar(7, usuarioFenix)).toEqual([
      {
        id: 1,
        usuario: { id: ana.id, nombre: "Ana Pérez", rol: "COMPRADOR" },
        mensaje: "¿A qué hora abren?",
        enviado: AHORA.toISOString(),
      },
      {
        id: 2,
        usuario: { id: fenix.id, nombre: "Fénix Producciones", rol: "ORGANIZADOR" },
        mensaje: "A las 17 h",
        enviado: DESPUES.toISOString(),
      },
    ]);
  });

  it("ordena por fecha de envío y después por id aunque estén desordenados", async () => {
    const compra = compraDeAna();
    compra.agregarMensaje(ana, "segundo", DESPUES);
    compra.agregarMensaje(ana, "primero", AHORA);
    compra.agregarMensaje(ana, "tercero", DESPUES);
    compras = [compra];
    const mensajes = await service.listar(7, usuarioAna);
    expect(mensajes.map((m) => m.mensaje)).toEqual(["primero", "segundo", "tercero"]);
  });

  it("devuelve [] si la compra no tiene mensajes", async () => {
    compras = [compraDeAna()];
    expect(await service.listar(7, usuarioAna)).toEqual([]);
  });

  it("rechaza una compra inexistente con 404", async () => {
    const promesa = service.listar(999, usuarioAna);
    await expect(promesa).rejects.toBeInstanceOf(NotFoundError);
    await expect(promesa).rejects.toThrow(MENSAJE_COMPRA_INEXISTENTE);
  });

  it.each([
    ["un comprador ajeno", usuarioBruno],
    ["el organizador de otro evento", usuarioKonex],
  ])("rechaza con 403 a %s", async (_caso, usuario) => {
    compras = [compraDeAna()];
    const promesa = service.listar(7, usuario);
    await expect(promesa).rejects.toBeInstanceOf(ForbiddenError);
    await expect(promesa).rejects.toThrow(MENSAJE_SIN_PERMISO);
  });
});

describe("MensajeService.enviar", () => {
  it("agrega el mensaje con la fecha de ahora, guarda la compra, notifica y lo devuelve", async () => {
    const compra = compraDeAna();
    compras = [compra];
    const mensaje = await service.enviar(7, { mensaje: "¿Hay guardarropas?" }, usuarioAna);
    const esperado = {
      id: 1,
      usuario: { id: ana.id, nombre: "Ana Pérez", rol: "COMPRADOR" },
      mensaje: "¿Hay guardarropas?",
      enviado: DESPUES.toISOString(),
    };
    expect(mensaje).toEqual(esperado);
    expect(compra.mensajes).toHaveLength(1);
    expect(repos.compraRepository.save).toHaveBeenCalledWith(compra);
    expect(notificador.mensajeNuevo).toHaveBeenCalledWith(7, esperado);
  });

  it("el organizador del evento responde con su nombre y rol", async () => {
    compras = [compraDeAna()];
    const mensaje = await service.enviar(7, { mensaje: "Sí, en la entrada" }, usuarioFenix);
    expect(mensaje.usuario).toEqual({
      id: fenix.id,
      nombre: "Fénix Producciones",
      rol: "ORGANIZADOR",
    });
  });

  it("toma el autor del repositorio y guarda una copia que no cambia con el usuario", async () => {
    const anaRenombrada = crearComprador({ nombre: "Anita" });
    repos.usuarioRepository.findById.mockResolvedValueOnce(anaRenombrada);
    compras = [compraDeAna()];
    const mensaje = await service.enviar(7, { mensaje: "Hola" }, usuarioAna);
    expect(mensaje.usuario.nombre).toBe("Anita Pérez");
    anaRenombrada.nombre = "Ana María";
    const [guardado] = await service.listar(7, usuarioAna);
    expect(guardado.usuario.nombre).toBe("Anita Pérez");
  });

  it.each(Object.values(EstadoCompra))("se puede escribir en una compra %s", async (estado) => {
    compras = [compraDeAna(estado)];
    await expect(service.enviar(7, { mensaje: "Hola" }, usuarioAna)).resolves.toMatchObject({
      mensaje: "Hola",
    });
  });

  it("notifica después de guardar", async () => {
    compras = [compraDeAna()];
    await service.enviar(7, { mensaje: "Hola" }, usuarioAna);
    const guardado = repos.compraRepository.save.mock.invocationCallOrder[0];
    const notificado = notificador.mensajeNuevo.mock.invocationCallOrder[0];
    expect(guardado).toBeLessThan(notificado);
  });

  it("rechaza una compra inexistente con 404 sin guardar ni notificar", async () => {
    await expect(service.enviar(999, { mensaje: "Hola" }, usuarioAna)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(repos.compraRepository.save).not.toHaveBeenCalled();
    expect(notificador.mensajeNuevo).not.toHaveBeenCalled();
  });

  it("rechaza con 403 a quien no participa sin guardar ni notificar", async () => {
    compras = [compraDeAna()];
    await expect(service.enviar(7, { mensaje: "Hola" }, usuarioBruno)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(repos.compraRepository.save).not.toHaveBeenCalled();
    expect(notificador.mensajeNuevo).not.toHaveBeenCalled();
  });

  it("sin notificador funciona igual", async () => {
    compras = [compraDeAna()];
    const sinNotificador = new MensajeService({ ...repos, reloj });
    await expect(sinNotificador.enviar(7, { mensaje: "Hola" }, usuarioAna)).resolves.toMatchObject({
      id: 1,
    });
  });
});
