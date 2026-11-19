import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { MensajeService } from "../../src/services/MensajeService.js";
import { MENSAJE_COMPRA_INEXISTENTE, MENSAJE_SIN_PERMISO } from "../../src/errors/mensajes.js";
import { ForbiddenError, NotFoundError } from "../../src/errors/AppError.js";
import { EstadoCompra } from "../../src/domain/EstadoCompra.js";
import { AHORA, crearComprador, crearCompra, crearEvento } from "../helpers/domainFactories.js";
import {
  ana,
  bruno,
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
      findByComprador: jest.fn(async (id) => compras.filter((c) => c.esDe(id))),
      findByOrganizador: jest.fn(async (id) => compras.filter((c) => c.evento.esDe(id))),
      save: jest.fn(async (compra) => compra),
    },
    usuarioRepository: usuarioRepositoryFake(),
  };
  reloj = { ahora: jest.fn(() => DESPUES) };
  notificador = { mensajeNuevo: jest.fn(), conversacionActualizada: jest.fn() };
  service = new MensajeService({ ...repos, reloj, notificador });
});

describe("MensajeService.listar", () => {
  it("devuelve los mensajes en orden cronológico con la forma del contrato", async () => {
    const compra = compraDeAna();
    compra.agregarMensaje(ana, "¿A qué hora abren?", AHORA);
    compra.agregarMensaje(fenix, "A las 17 h", DESPUES);
    compras = [compra];
    expect((await service.listar(7, usuarioFenix)).mensajes).toEqual([
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
    const { mensajes } = await service.listar(7, usuarioAna);
    expect(mensajes.map((m) => m.mensaje)).toEqual(["primero", "segundo", "tercero"]);
  });

  it("devuelve una página vacía si la compra no tiene mensajes", async () => {
    compras = [compraDeAna()];
    expect(await service.listar(7, usuarioAna)).toEqual({ mensajes: [], hayMas: false });
  });

  describe("paginado por cursor", () => {
    const textos = (pagina) => pagina.mensajes.map((m) => m.mensaje);

    beforeEach(() => {
      const compra = compraDeAna();
      for (let i = 1; i <= 35; i++) compra.agregarMensaje(ana, `m${i}`, AHORA);
      compras = [compra];
    });

    it("sin cursor trae los 30 más recientes en orden y avisa que hay más", async () => {
      const pagina = await service.listar(7, usuarioAna);
      expect(textos(pagina)).toEqual(Array.from({ length: 30 }, (_, i) => `m${i + 6}`));
      expect(pagina.hayMas).toBe(true);
    });

    it("con antesDe trae los anteriores a ese id", async () => {
      const pagina = await service.listar(7, usuarioAna, { antesDe: 6, limit: 30 });
      expect(textos(pagina)).toEqual(["m1", "m2", "m3", "m4", "m5"]);
      expect(pagina.hayMas).toBe(false);
    });

    it("si quedan justo limit mensajes no hay más", async () => {
      const pagina = await service.listar(7, usuarioAna, { antesDe: 6, limit: 5 });
      expect(textos(pagina)).toHaveLength(5);
      expect(pagina.hayMas).toBe(false);
    });

    it("respeta el límite", async () => {
      const pagina = await service.listar(7, usuarioAna, { antesDe: 11, limit: 3 });
      expect(textos(pagina)).toEqual(["m8", "m9", "m10"]);
      expect(pagina.hayMas).toBe(true);
    });
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
    const {
      mensajes: [guardado],
    } = await service.listar(7, usuarioAna);
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

describe("MensajeService.enviar notifica la bandeja", () => {
  it("avisa a la otra parte con el último mensaje y sus no leídos", async () => {
    const compra = compraDeAna();
    compra.agregarMensaje(ana, "Hola", AHORA);
    compras = [compra];
    const mensaje = await service.enviar(7, { mensaje: "¿Hay guardarropas?" }, usuarioAna);
    expect(notificador.conversacionActualizada).toHaveBeenCalledWith(fenix.id, {
      compraId: 7,
      ultimoMensaje: mensaje,
      noLeidos: 2,
    });
  });

  it("si escribe el organizador avisa al comprador", async () => {
    compras = [compraDeAna()];
    await service.enviar(7, { mensaje: "Hola" }, usuarioFenix);
    expect(notificador.conversacionActualizada.mock.calls[0][0]).toBe(ana.id);
  });
});

describe("MensajeService.listarConversaciones", () => {
  const TODO = { page: 1, limit: 20 };
  let piojos;
  const compraCon = (id, mensajes, comprador = ana) => {
    const evento = piojos;
    const compra = crearCompra({ id, comprador, evento });
    for (const [autor, minuto] of mensajes) {
      compra.agregarMensaje(autor, `m${minuto}`, new Date(AHORA.getTime() + minuto * 60_000));
    }
    return compra;
  };

  beforeEach(() => {
    piojos = crearEvento({ id: 1, multimedia: ["/imagenes/piojos.jpg"] });
    compras = [
      compraCon(1, [[ana, 1]]),
      compraCon(2, []),
      compraCon(3, [
        [ana, 2],
        [fenix, 5],
      ]),
      compraCon(4, [[bruno, 9]], bruno),
    ];
  });

  it("al comprador le lista sus compras con mensajes, primero la del mensaje más reciente", async () => {
    const pagina = await service.listarConversaciones(usuarioAna, TODO);
    expect(pagina.conversaciones.map((c) => c.compraId)).toEqual([3, 1]);
    expect(pagina).toMatchObject({ total: 2, page: 1, totalPages: 1, totalNoLeidos: 1 });
    expect(pagina.conversaciones[0]).toEqual({
      compraId: 3,
      estado: "PENDIENTE",
      evento: { id: 1, nombre: "Los Piojos en River", imagen: "/imagenes/piojos.jpg" },
      contraparte: { id: fenix.id, nombre: "Fénix Producciones" },
      ultimoMensaje: expect.objectContaining({ id: 2, mensaje: "m5" }),
      noLeidos: 1,
    });
  });

  it("al organizador le lista las compras de sus eventos con la contraparte compradora", async () => {
    const pagina = await service.listarConversaciones(usuarioFenix, TODO);
    expect(pagina.conversaciones.map((c) => c.compraId)).toEqual([4, 3, 1]);
    expect(pagina.conversaciones[0].contraparte).toEqual({ id: bruno.id, nombre: "Bruno Gómez" });
    expect(pagina.totalNoLeidos).toBe(2);
  });

  it("pagina y totalNoLeidos suma todas las conversaciones, no solo la página", async () => {
    const pagina = await service.listarConversaciones(usuarioFenix, { page: 1, limit: 1 });
    expect(pagina.conversaciones.map((c) => c.compraId)).toEqual([4]);
    expect(pagina).toMatchObject({ total: 3, totalPages: 3, totalNoLeidos: 2 });
  });

  it("sin conversaciones devuelve una página vacía", async () => {
    compras = [];
    expect(await service.listarConversaciones(usuarioAna, TODO)).toEqual({
      conversaciones: [],
      total: 0,
      page: 1,
      totalPages: 0,
      totalNoLeidos: 0,
    });
  });
});

describe("MensajeService.marcarLeidos", () => {
  it("deja en cero los no leídos del usuario y guarda la compra", async () => {
    const compra = compraDeAna();
    compra.agregarMensaje(fenix, "Hola", AHORA);
    compras = [compra];
    await service.marcarLeidos(7, usuarioAna);
    expect(compra.noLeidosPara(ana.id)).toBe(0);
    expect(repos.compraRepository.save).toHaveBeenCalledWith(compra);
  });

  it("rechaza con 403 a quien no participa y con 404 una compra inexistente", async () => {
    compras = [compraDeAna()];
    await expect(service.marcarLeidos(7, usuarioBruno)).rejects.toBeInstanceOf(ForbiddenError);
    await expect(service.marcarLeidos(999, usuarioAna)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("MensajeService.verificarParticipante", () => {
  it("resuelve si el usuario participa de la compra", async () => {
    compras = [compraDeAna()];
    await expect(service.verificarParticipante(7, usuarioFenix)).resolves.toBeUndefined();
  });

  it("rechaza una compra inexistente con 404 y a quien no participa con 403", async () => {
    compras = [compraDeAna()];
    await expect(service.verificarParticipante(999, usuarioAna)).rejects.toThrow(
      MENSAJE_COMPRA_INEXISTENTE,
    );
    await expect(service.verificarParticipante(7, usuarioKonex)).rejects.toThrow(
      MENSAJE_SIN_PERMISO,
    );
  });
});
