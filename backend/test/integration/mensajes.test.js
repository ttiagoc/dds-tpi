import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import {
  crearAppDePrueba,
  pedirComo,
  idDeCompraDelSeed,
  ANA,
  BRUNO,
  FENIX,
  KONEX,
} from "../helpers/appDePrueba.js";
import { AHORA } from "../helpers/domainFactories.js";
import { MENSAJE_COMPRA_INEXISTENTE, MENSAJE_SIN_PERMISO } from "../../src/errors/mensajes.js";
import { MENSAJE_SIN_SESION } from "../../src/middlewares/autenticar.js";

const PRIMAVERA = "Festival Primavera Sonora";
const HOLA = { mensaje: "Hola" };

let app;
let contenedor;

beforeEach(async () => {
  ({ app, contenedor } = await crearAppDePrueba());
});

const idDeCompra = (nombreEvento) => idDeCompraDelSeed(contenedor, ANA, nombreEvento);
const leer = (id, email = ANA, query = "") =>
  pedirComo(app, request(app).get(`/compras/${id}/mensajes${query}`), email);
const escribir = (id, body, email = ANA) =>
  pedirComo(app, request(app).post(`/compras/${id}/mensajes`).send(body), email);
const mensajeDe = (nombre, rol, mensaje) => ({
  id: expect.any(Number),
  usuario: { id: expect.any(Number), nombre, rol },
  mensaje,
  enviado: expect.any(String),
});

describe("GET /compras/:id/mensajes", () => {
  it("Ana y Fénix leen el chat de ana-primavera en orden", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const deAna = await leer(id);
    expect(deAna.status).toBe(200);
    expect(deAna.body).toEqual({
      mensajes: [
        mensajeDe("Ana Pérez", "COMPRADOR", "¿A qué hora abren las puertas?"),
        mensajeDe("Fénix Producciones", "ORGANIZADOR", "Abrimos a las 17 h. ¡Los esperamos!"),
      ],
      hayMas: false,
    });
    const deFenix = await leer(id, FENIX);
    expect(deFenix.status).toBe(200);
    expect(deFenix.body).toEqual(deAna.body);
  });

  it("una compra sin mensajes devuelve una página vacía", async () => {
    const res = await leer(await idDeCompra("Noche de Stand-up"));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mensajes: [], hayMas: false });
  });

  it("pagina hacia atrás con antesDe y limit", async () => {
    const id = await idDeCompra(PRIMAVERA);
    for (let i = 1; i <= 3; i++) await escribir(id, { mensaje: `extra ${i}` });
    const ultimos = await leer(id, ANA, "?limit=2");
    expect(ultimos.status).toBe(200);
    expect(ultimos.body.mensajes.map((m) => m.mensaje)).toEqual(["extra 2", "extra 3"]);
    expect(ultimos.body.hayMas).toBe(true);
    const anteriores = await leer(id, ANA, "?antesDe=3&limit=5");
    expect(anteriores.body.mensajes.map((m) => m.id)).toEqual([1, 2]);
    expect(anteriores.body.hayMas).toBe(false);
  });

  it.each(["?antesDe=abc", "?limit=0", "?page=2"])("responde 400 con la query %s", async (q) => {
    const res = await leer(await idDeCompra(PRIMAVERA), ANA, q);
    expect(res.status).toBe(400);
  });
});

describe("POST /compras/:id/mensajes", () => {
  it("Ana y Fénix escriben y el chat queda en orden", async () => {
    const id = await idDeCompra(PRIMAVERA);
    const deAna = await escribir(id, { mensaje: "  ¿Hay guardarropas?  " });
    expect(deAna.status).toBe(201);
    expect(deAna.body).toEqual({
      ...mensajeDe("Ana Pérez", "COMPRADOR", "¿Hay guardarropas?"),
      id: 3,
      enviado: AHORA.toISOString(),
    });
    const deFenix = await escribir(id, { mensaje: "Sí, en la entrada" }, FENIX);
    expect(deFenix.status).toBe(201);
    expect(deFenix.body).toMatchObject({ id: 4, usuario: { rol: "ORGANIZADOR" } });
    const chat = await leer(id);
    expect(chat.body.mensajes.map((m) => m.id)).toEqual([1, 2, 3, 4]);
  });

  it.each([["Hamlet"], ["Clásico de Básquet"], ["Rock en el Parque"]])(
    "se puede escribir en la compra de %s (cancelada, reembolsada o de un evento pasado)",
    async (evento) => {
      const res = await escribir(await idDeCompra(evento), HOLA);
      expect(res.status).toBe(201);
    },
  );
});

describe("permisos del chat", () => {
  it.each([
    ["Bruno (comprador ajeno)", BRUNO],
    ["Konex (organizador de otro evento)", KONEX],
  ])("%s recibe 403 al leer y al escribir", async (_caso, email) => {
    const id = await idDeCompra(PRIMAVERA);
    for (const res of [await leer(id, email), await escribir(id, HOLA, email)]) {
      expect(res.status).toBe(403);
      expect(res.body.message).toBe(MENSAJE_SIN_PERMISO);
    }
  });

  it("sin token responde 401", async () => {
    const id = await idDeCompra(PRIMAVERA);
    for (const res of [await leer(id, null), await escribir(id, HOLA, null)]) {
      expect(res.status).toBe(401);
      expect(res.body.message).toBe(MENSAJE_SIN_SESION);
    }
  });

  it("una compra inexistente responde 404 y un id inválido 400", async () => {
    for (const res of [await leer(999), await escribir(999, HOLA)]) {
      expect(res.status).toBe(404);
      expect(res.body.message).toBe(MENSAJE_COMPRA_INEXISTENTE);
    }
    for (const res of [await leer("abc"), await escribir("abc", HOLA)]) {
      expect(res.status).toBe(400);
      expect(res.body.message).toBe("El id debe ser un entero positivo");
    }
  });
});

describe("mensaje inválido", () => {
  it.each([
    [{ mensaje: "" }],
    [{ mensaje: "   " }],
    [{ mensaje: "a".repeat(501) }],
    [{ mensaje: 5 }],
    [{}],
    [{ mensaje: "Hola", extra: true }],
  ])("responde 400 con %p y el chat no cambia", async (body) => {
    const id = await idDeCompra(PRIMAVERA);
    expect((await escribir(id, body)).status).toBe(400);
    expect((await leer(id)).body.mensajes).toHaveLength(2);
  });

  it("valida el body antes que la existencia de la compra", async () => {
    expect((await escribir(999, { mensaje: "" })).status).toBe(400);
  });
});
