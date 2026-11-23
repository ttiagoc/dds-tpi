import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { crearAppDePrueba, loginComo, conToken } from "../helpers/appDePrueba.js";
import {
  enDias,
  bodyEvento,
  tipoEntradaBody,
  UBICACION_DE_PRUEBA,
  geocodificadorFijo,
} from "../helpers/domainFactories.js";

const FENIX = "fenix@aiticket.com";
const ANA = "ana@aiticket.com";

let app;

beforeEach(async () => {
  ({ app } = await crearAppDePrueba());
});

const crear = (body, token) => conToken(request(app).post("/eventos").send(body), token);
const misEventos = (query, token) =>
  conToken(request(app).get("/organizadores/yo/eventos").query(query), token);

const tipo = tipoEntradaBody;
const body = bodyEvento;
const tipos = (cantidad) =>
  Array.from({ length: cantidad }, (_v, i) => tipo({ nombre: `Tipo ${i}` }));

describe("POST /eventos", () => {
  it("crea el evento de Fénix y queda disponible en GET /eventos/:id", async () => {
    const res = await crear(body(), await loginComo(app, FENIX));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      nombre: "Stand-up en el Konex",
      categoria: { id: 6 },
      organizador: { nombre: "Fénix Producciones", puntajePromedio: 4.5 },
      esFavorito: false,
      tiposEntrada: [
        { nombre: "General", descripcion: "De pie", cupo: 200, disponibles: 200 },
        { nombre: "VIP", cupo: 20, disponibles: 20 },
      ],
    });
    const detalle = await request(app).get(`/eventos/${res.body.id}`);
    expect(detalle.status).toBe(200);
    expect(detalle.body).toEqual(res.body);
  });

  it.each([
    ["sin token", null, 401, "Necesitás iniciar sesión"],
    ["con el token de Ana", ANA, 403, "No tenés permiso para realizar esta acción"],
  ])("%s los dos endpoints responden %i", async (_caso, email, status, mensaje) => {
    const token = email && (await loginComo(app, email));
    for (const res of [await crear(body(), token), await misEventos({}, token)]) {
      expect(res.status).toBe(status);
      expect(res.body.message).toBe(mensaje);
    }
  });

  it.each([
    ["sin token", null, 401],
    ["con el token de Ana", ANA, 403],
  ])("%s responde %i antes de validar un body inválido", async (_caso, email, status) => {
    const token = email && (await loginComo(app, email));
    const res = await crear(body({ organizadorId: 3, tiposEntrada: [] }), token);
    expect(res.status).toBe(status);
  });

  it("sin multimedia guarda la lista vacía e imagen null", async () => {
    const sinMultimedia = body();
    delete sinMultimedia.multimedia;
    const res = await crear(sinMultimedia, await loginComo(app, FENIX));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ multimedia: [], imagen: null });
  });

  it("guarda la dirección y la ubicación que devuelve el geocodificador", async () => {
    const res = await crear(body(), await loginComo(app, FENIX));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      direccion: "Sarmiento 3131, CABA, Buenos Aires",
      ubicacion: UBICACION_DE_PRUEBA,
    });
  });

  it("si el geocodificador no encuentra la dirección responde 422 con details", async () => {
    ({ app } = await crearAppDePrueba({ geocodificador: geocodificadorFijo(null) }));
    const res = await crear(body(), await loginComo(app, FENIX));
    expect(res.status).toBe(422);
    expect(res.body.details).toEqual([
      { campo: "direccion", mensaje: "No encontramos esa dirección" },
    ]);
  });

  it("sin dirección responde 400", async () => {
    const res = await crear(body({ direccion: undefined }), await loginComo(app, FENIX));
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.campo)).toEqual(["direccion"]);
  });

  it("crea el evento con la ruta que devuelve POST /imagenes", async () => {
    const imagen = "/imagenes/subidas/3f2a.jpg";
    const res = await crear(body({ multimedia: [imagen] }), await loginComo(app, FENIX));
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ multimedia: [imagen], imagen });
  });

  it.each([
    ["fecha", { fecha: enDias(-1).toISOString() }, "La fecha del evento tiene que ser futura"],
    ["categoriaId", { categoriaId: 999 }, "La categoría no existe"],
  ])("el 422 de %s trae details con el campo", async (campo, overrides, mensaje) => {
    const res = await crear(body(overrides), await loginComo(app, FENIX));
    expect(res.status).toBe(422);
    expect(res.body.details).toEqual([{ campo, mensaje }]);
  });

  it.each([
    ["sin tiposEntrada", { tiposEntrada: undefined }],
    ["con 11 tipos", { tiposEntrada: tipos(11) }],
    ["con una URL ftp", { multimedia: ["ftp://img/1.jpg"] }],
    ["con fecha 'mañana'", { fecha: "mañana" }],
    ["con cupo 1.5", { tiposEntrada: [tipo({ cupo: 1.5 })] }],
    ["con organizadorId", { organizadorId: 3 }],
  ])("%s responde 400 con details", async (_caso, overrides) => {
    const res = await crear(body(overrides), await loginComo(app, FENIX));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Datos inválidos");
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it.each([
    [
      "fecha pasada",
      { fecha: enDias(-1).toISOString() },
      "La fecha del evento tiene que ser futura",
    ],
    [
      "precio negativo",
      { tiposEntrada: [tipo({ precio: -1 })] },
      "El precio no puede ser negativo",
    ],
    ["cupo 0", { tiposEntrada: [tipo({ cupo: 0 })] }, "El cupo tiene que ser un entero mayor a 0"],
    [
      "tipos General y general",
      { tiposEntrada: [tipo(), tipo({ nombre: "general" })] },
      "Ya hay un tipo de entrada llamado general",
    ],
    ["categoriaId 999", { categoriaId: 999 }, "La categoría no existe"],
  ])("con %s responde 422 con el mensaje del dominio", async (_caso, overrides, mensaje) => {
    const res = await crear(body(overrides), await loginComo(app, FENIX));
    expect(res.status).toBe(422);
    expect(res.body.message).toBe(mensaje);
  });
});

describe("GET /organizadores/yo/eventos", () => {
  it("trae los 6 eventos de Fénix, incluido el pasado, por fecha asc y con sus ventas", async () => {
    const res = await misEventos({}, await loginComo(app, FENIX));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 6, page: 1, totalPages: 1 });
    expect(res.body.eventos.every((e) => e.organizador.puntajePromedio === 4.5)).toBe(true);
    expect(res.body.eventos.map((e) => e.nombre)).toEqual([
      "Rock en el Parque",
      "Los Piojos en River",
      "Clásico de Básquet",
      "Maratón Nocturna",
      "Festival Primavera Sonora",
      "Fiesta Electrónica al Aire Libre",
    ]);
    const evento = (nombre) => res.body.eventos.find((e) => e.nombre === nombre);
    expect(evento("Festival Primavera Sonora")).toMatchObject({
      vendidas: 20,
      cupo: 3020,
      recaudado: 2820000,
    });
    expect(evento("Los Piojos en River")).toMatchObject({ vendidas: 0, cupo: 700, recaudado: 0 });
    expect(evento("Fiesta Electrónica al Aire Libre")).toMatchObject({ vendidas: 2, recaudado: 0 });
    expect(evento("Clásico de Básquet")).toMatchObject({ vendidas: 0, recaudado: 0 });
    const sumar = (campo) => res.body.eventos.reduce((suma, e) => suma + e[campo], 0);
    expect(res.body.resumen).toEqual({
      recaudado: sumar("recaudado"),
      vendidas: sumar("vendidas"),
    });
    expect(res.body.eventos.map((e) => e.finalizado)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("pagina con limit y page", async () => {
    const res = await misEventos({ limit: 4, page: 2 }, await loginComo(app, FENIX));
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 6, page: 2, totalPages: 2 });
    expect(res.body.eventos.map((e) => e.nombre)).toEqual([
      "Festival Primavera Sonora",
      "Fiesta Electrónica al Aire Libre",
    ]);
  });

  it.each([[{ limit: 51 }], [{ q: "rock" }]])("con %p responde 400", async (query) => {
    const res = await misEventos(query, await loginComo(app, FENIX));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Parámetros de consulta inválidos");
  });
});
