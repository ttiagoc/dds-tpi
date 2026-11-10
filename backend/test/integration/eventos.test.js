import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { SECRET_DE_TEST } from "../../src/config/entorno.js";
import { crearAppDePrueba, loginComo } from "../helpers/appDePrueba.js";
import { AHORA, enDias } from "../helpers/domainFactories.js";
import { Usuario } from "../../src/domain/Usuario.js";
import { Evento } from "../../src/domain/Evento.js";
import { Rol } from "../../src/domain/Rol.js";

const QUERY_INVALIDA = "Parámetros de consulta inválidos";

let app;
let contenedor;

beforeEach(async () => {
  ({ app, contenedor } = await crearAppDePrueba());
});

const get = (ruta, token) => {
  const pedido = request(app).get(ruta);
  return token ? pedido.set("Authorization", `Bearer ${token}`) : pedido;
};
const nombres = (res) => res.body.eventos.map((e) => e.nombre);

async function idDelEvento(nombre) {
  const evento = await contenedor.repos.eventoRepository.findOneWhere((e) => e.nombre === nombre);
  return evento.id;
}

async function agregarOrganizadorSinResenias() {
  const { usuarioRepository, categoriaRepository, eventoRepository } = contenedor.repos;
  const organizador = await usuarioRepository.save(
    new Usuario({
      nombre: "Nuevo",
      email: "nuevo@aiticket.com",
      passwordHash: "x",
      rol: Rol.ORGANIZADOR,
    }),
  );
  await eventoRepository.save(
    new Evento({
      nombre: "Evento sin reseñas",
      descripcion: "Primer evento",
      categoria: await categoriaRepository.findById(1),
      fecha: enDias(1),
      lugar: "Lugar",
      tiposEntrada: [{ nombre: "General", precio: 1000, cupo: 10 }],
      organizador,
    }),
  );
}

describe("GET /categorias", () => {
  it("responde 200 con las 6 categorías sembradas ordenadas por id", async () => {
    const res = await get("/categorias");
    expect(res.status).toBe(200);
    expect(res.body.map((c) => c.id)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(res.body[0]).toEqual({ id: 1, nombre: "Recitales", descripcion: "Música en vivo" });
  });
});

describe("GET /eventos", () => {
  it("busca por texto sin acentos ni mayúsculas combinado con categoría", async () => {
    const res = await get("/eventos?q=PIOJOS&categoria=1");
    expect(res.status).toBe(200);
    expect(nombres(res)).toEqual(["Los Piojos en River"]);
    expect(res.body.eventos[0]).toMatchObject({ categoria: { id: 1, nombre: "Recitales" } });
  });

  it("con una categoría inexistente responde 200 con la lista vacía", async () => {
    const res = await get("/eventos?categoria=999");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ eventos: [], total: 0, page: 1, totalPages: 0 });
  });

  it("excluye los eventos pasados salvo con incluirPasados=true", async () => {
    const futuros = await get("/eventos");
    expect(futuros.body.total).toBe(9);
    expect(futuros.body.eventos.every((e) => new Date(e.fecha) > AHORA)).toBe(true);
    const todos = await get("/eventos?incluirPasados=true&limit=50");
    expect(todos.body.total).toBe(12);
    expect(nombres(todos)).toEqual(expect.arrayContaining(["Rock en el Parque", "Impro Total"]));
  });

  it("filtra por precio y ordena por precioDesde desc", async () => {
    const res = await get("/eventos?precioMin=10000&precioMax=20000&ordenarPor=precio&orden=desc");
    expect(res.status).toBe(200);
    expect(nombres(res)).toEqual([
      "Clásico de Básquet",
      "Noche de Tango",
      "Noche de Stand-up",
      "Maratón Nocturna",
    ]);
    expect(res.body.eventos.map((e) => e.precioDesde)).toEqual([20000, 18000, 15000, 12000]);
  });

  it("ordena por puntaje con los organizadores sin reseñas al final en los dos órdenes", async () => {
    await agregarOrganizadorSinResenias();
    const puntajes = (res) => res.body.eventos.map((e) => e.organizador.puntajePromedio);
    const desc = await get("/eventos?ordenarPor=puntaje&incluirPasados=true&limit=50");
    expect(puntajes(desc)).toEqual([...Array(6).fill(4.5), ...Array(6).fill(3.5), null]);
    const asc = await get("/eventos?ordenarPor=puntaje&orden=asc&incluirPasados=true&limit=50");
    expect(puntajes(asc)).toEqual([...Array(6).fill(3.5), ...Array(6).fill(4.5), null]);
  });

  it("pagina los resultados ordenados por fecha", async () => {
    const res = await get("/eventos?limit=2&page=2");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 9, page: 2, totalPages: 5 });
    expect(nombres(res)).toEqual(["Los Piojos en River", "Clásico de Básquet"]);
  });

  it.each([
    "limit=51",
    "ordenarPor=nombre",
    "incluirPasados=si",
    "precioMin=-1",
    "precioMin=500&precioMax=100",
    "desconocido=1",
  ])("responde 400 con %s", async (query) => {
    const res = await get(`/eventos?${query}`);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: "fail", message: QUERY_INVALIDA });
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it("marca los favoritos de Ana con su token", async () => {
    const token = await loginComo(app, "ana@aiticket.com");
    const res = await get("/eventos?limit=50", token);
    const favoritos = res.body.eventos.filter((e) => e.esFavorito).map((e) => e.nombre);
    expect(favoritos.sort()).toEqual(["Fiesta Electrónica al Aire Libre", "Hamlet"]);
  });

  it.each([
    ["sin token", undefined],
    ["con un token inválido", "no-es-un-jwt"],
  ])("%s responde 200 con esFavorito false en todos", async (_caso, token) => {
    const res = await get("/eventos?limit=50", token);
    expect(res.status).toBe(200);
    expect(res.body.eventos.every((e) => e.esFavorito === false)).toBe(true);
  });
});

describe("GET /eventos/:id", () => {
  it("devuelve el detalle de un evento pasado con disponibles y puntaje", async () => {
    const id = await idDelEvento("Rock en el Parque");
    const res = await get(`/eventos/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      descripcion: "Tarde de rock nacional al aire libre.",
      multimedia: ["https://picsum.photos/seed/rock/800/450"],
      imagen: "https://picsum.photos/seed/rock/800/450",
      organizador: { nombre: "Fénix Producciones", puntajePromedio: 4.5 },
      tiposEntrada: [{ nombre: "Campo", precio: 40000, cupo: 600, disponibles: 594 }],
    });
  });

  it("marca esFavorito con el token de Ana", async () => {
    const token = await loginComo(app, "ana@aiticket.com");
    const res = await get(`/eventos/${await idDelEvento("Hamlet")}`, token);
    expect(res.body.esFavorito).toBe(true);
  });

  it.each([
    ["mal formado", async () => "no-es-un-jwt"],
    [
      "vencido",
      async () => {
        const ana = await contenedor.repos.usuarioRepository.findByEmail("ana@aiticket.com");
        return jwt.sign({ rol: Rol.COMPRADOR }, SECRET_DE_TEST, {
          subject: String(ana.id),
          expiresIn: -10,
        });
      },
    ],
    [
      "de un usuario borrado",
      async () => {
        const token = await loginComo(app, "ana@aiticket.com");
        await contenedor.repos.usuarioRepository.delete(Number(jwt.decode(token).sub));
        return token;
      },
    ],
  ])("con un token %s responde 200 como anónimo", async (_caso, crearToken) => {
    const token = await crearToken();
    const res = await get(`/eventos/${await idDelEvento("Hamlet")}`, token);
    expect(res.status).toBe(200);
    expect(res.body.esFavorito).toBe(false);
  });

  it("responde 404 si el evento no existe", async () => {
    const res = await get("/eventos/999");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No existe el evento");
  });

  it("responde 400 si el id no es un entero positivo", async () => {
    const res = await get("/eventos/abc");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("El id debe ser un entero positivo");
  });
});
