import { describe, it, expect, beforeAll } from "@jest/globals";
import request from "supertest";
import { crearAppDePrueba } from "../helpers/appDePrueba.js";

const OPERACIONES_DE_PLANES_03 = [
  "GET /healthcheck",
  "GET /imagenes/{archivo}",
  "POST /auth/login",
  "GET /auth/yo",
  "GET /categorias",
  "GET /eventos",
  "POST /eventos",
  "GET /eventos/{id}",
  "GET /eventos/{id}/compras",
  "GET /organizadores/yo/eventos",
  "GET /organizadores/{id}/resenias",
  "GET /compras",
  "POST /compras",
  "GET /compras/{id}",
  "POST /compras/{id}/pago",
  "POST /compras/{id}/cancelacion",
  "POST /compras/{id}/uso",
  "POST /compras/{id}/resenia",
  "GET /compras/{id}/mensajes",
  "POST /compras/{id}/mensajes",
  "GET /usuarios/yo/favoritos",
  "PUT /usuarios/yo/favoritos/{eventoId}",
  "DELETE /usuarios/yo/favoritos/{eventoId}",
];

const METODOS = ["get", "post", "put", "patch", "delete"];

let documento;

function operaciones(doc) {
  return Object.entries(doc.paths).flatMap(([ruta, item]) =>
    METODOS.filter((metodo) => item[metodo]).map((metodo) => ({
      clave: `${metodo.toUpperCase()} ${ruta}`,
      ruta,
      item,
      operacion: item[metodo],
    })),
  );
}

function referencias(valor) {
  if (Array.isArray(valor)) return valor.flatMap(referencias);
  if (valor === null || typeof valor !== "object") return [];
  const propias = typeof valor.$ref === "string" ? [valor.$ref] : [];
  return [...propias, ...Object.values(valor).flatMap(referencias)];
}

const resolver = (doc, ref) =>
  ref
    .replace(/^#\//, "")
    .split("/")
    .reduce((nodo, parte) => nodo?.[parte], doc);

beforeAll(async () => {
  const { app } = await crearAppDePrueba();
  documento = (await request(app).get("/api-docs.json")).body;
});

describe("Swagger", () => {
  it("GET /api-docs sirve Swagger UI", async () => {
    const { app } = await crearAppDePrueba();
    const res = await request(app).get("/api-docs/").redirects(1);
    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("GET /api-docs.json responde el documento OpenAPI 3.0.3 con la guía para probar", () => {
    expect(documento.openapi).toBe("3.0.3");
    expect(documento.info.description).toContain("POST /auth/login");
    expect(documento.components.securitySchemes.bearerAuth).toMatchObject({ scheme: "bearer" });
  });

  it("documenta exactamente las operaciones implementadas de planes/03", () => {
    const documentadas = operaciones(documento).map((o) => o.clave);
    expect([...documentadas].sort()).toEqual([...OPERACIONES_DE_PLANES_03].sort());
  });

  it("documenta los eventos de Socket.io en el tag Chat y en las acciones de la compra", () => {
    const chat = documento.tags.find((tag) => tag.name === "Chat");
    for (const evento of ["compra:unirse", "compra:salir", "mensaje:nuevo", "compra:estado"]) {
      expect(chat.description).toContain(evento);
    }
    for (const accion of ["pago", "cancelacion", "uso"]) {
      expect(documento.paths[`/compras/{id}/${accion}`].post.description).toContain(
        "compra:estado",
      );
    }
  });

  it("cada $ref apunta a algo que existe", () => {
    const rotas = referencias(documento).filter((ref) => resolver(documento, ref) == null);
    expect(rotas).toEqual([]);
  });

  it("cada operación tiene tag, resumen y al menos una respuesta exitosa", () => {
    for (const { clave, operacion } of operaciones(documento)) {
      expect({ clave, tags: operacion.tags?.length > 0, summary: !!operacion.summary }).toEqual({
        clave,
        tags: true,
        summary: true,
      });
      const exitosas = Object.keys(operacion.responses).filter((status) => status.startsWith("2"));
      expect({ clave, exitosas: exitosas.length }).toEqual({ clave, exitosas: 1 });
    }
  });

  it("cada operación con sesión obligatoria tiene bearerAuth y 401", () => {
    const conSesion = operaciones(documento).filter(({ operacion }) =>
      operacion.security?.every((requisito) => requisito.bearerAuth),
    );
    expect(conSesion.length).toBeGreaterThan(0);
    for (const { clave, operacion } of conSesion) {
      expect({ clave, tiene401: "401" in operacion.responses }).toEqual({ clave, tiene401: true });
    }
  });

  it("cada operación restringida a un rol tiene 403", () => {
    const conRol = operaciones(documento).filter(({ operacion }) =>
      /^\*\*Solo (COMPRADOR|ORGANIZADOR)\.\*\*/.test(operacion.description ?? ""),
    );
    expect(conRol.length).toBeGreaterThan(0);
    for (const { clave, operacion } of conRol) {
      expect({ clave, tiene403: "403" in operacion.responses }).toEqual({ clave, tiene403: true });
    }
  });

  it("cada path con {id} o {eventoId} declara el parámetro y responde 400", () => {
    for (const { clave, ruta, item, operacion } of operaciones(documento)) {
      const nombres = [...ruta.matchAll(/\{(\w+)\}/g)].map(([, nombre]) => nombre);
      const declarados = [...(item.parameters ?? []), ...(operacion.parameters ?? [])]
        .filter((p) => p.in === "path")
        .map((p) => p.name);
      expect({ clave, declarados }).toEqual({ clave, declarados: nombres });
      if (nombres.some((nombre) => ["id", "eventoId"].includes(nombre))) {
        expect({ clave, tiene400: "400" in operacion.responses }).toEqual({
          clave,
          tiene400: true,
        });
      }
    }
  });
});
