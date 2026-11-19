import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { crearAppDePrueba, pedirComo, ANA, FENIX } from "../helpers/appDePrueba.js";
import { MENSAJE_SIN_PERMISO } from "../../src/errors/mensajes.js";

const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const MEGA = 1024 * 1024;

let app;
let carpeta;

beforeEach(async () => {
  carpeta = await mkdtemp(join(tmpdir(), "imagenes-"));
  ({ app } = await crearAppDePrueba({ carpetaImagenes: carpeta }));
});

afterEach(() => rm(carpeta, { recursive: true, force: true }));

const subir = (email, adjuntar = (pedido) => pedido.attach("imagen", JPG, "portada.jpg")) =>
  pedirComo(app, adjuntar(request(app).post("/imagenes")), email);

describe("POST /imagenes", () => {
  it("Fénix sube una portada JPG, recibe la url y la imagen queda servida", async () => {
    const res = await subir(FENIX);
    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/imagenes\/subidas\/[0-9a-f-]{36}\.jpg$/);
    expect(await readdir(join(carpeta, "subidas"))).toHaveLength(1);
    const servida = await request(app).get(res.body.url);
    expect(servida.status).toBe(200);
    expect(servida.headers["content-type"]).toBe("image/jpeg");
  });

  it.each([
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])("acepta %s y guarda con extensión .%s", async (contentType, extension) => {
    const res = await subir(FENIX, (p) =>
      p.attach("imagen", JPG, { filename: "foto", contentType }),
    );
    expect(res.status).toBe(201);
    expect(res.body.url.endsWith(`.${extension}`)).toBe(true);
  });

  it("sin archivo responde 400 Falta la imagen", async () => {
    const res = await subir(FENIX, (p) => p.field("otro", "x"));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Falta la imagen");
  });

  it("un PDF responde 400 y no guarda nada", async () => {
    const res = await subir(FENIX, (p) =>
      p.attach("imagen", Buffer.from("%PDF-1.4"), {
        filename: "doc.pdf",
        contentType: "application/pdf",
      }),
    );
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("La imagen tiene que ser JPG, PNG o WEBP");
    const guardadas = await readdir(join(carpeta, "subidas")).catch(() => []);
    expect(guardadas).toHaveLength(0);
  });

  it("más de 5 MB responde 413", async () => {
    const grande = Buffer.alloc(5 * MEGA + 1);
    const res = await subir(FENIX, (p) => p.attach("imagen", grande, "grande.jpg"));
    expect(res.status).toBe(413);
    expect(res.body.message).toBe("La imagen no puede pesar más de 5 MB");
  });

  it("un comprador recibe 403 y sin sesión 401", async () => {
    const comprador = await subir(ANA);
    expect(comprador.status).toBe(403);
    expect(comprador.body.message).toBe(MENSAJE_SIN_PERMISO);
    expect((await subir(null)).status).toBe(401);
  });
});
