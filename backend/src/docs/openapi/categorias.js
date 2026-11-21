import { error, limit, ok, page, paginado, query, ref } from "./comun.js";

export default {
  tags: [{ name: "Categorías", description: "Categorías para filtrar eventos" }],
  paths: {
    "/categorias": {
      get: {
        tags: ["Categorías"],
        summary: "Listar categorías",
        description:
          "Por nombre asc e id asc. `q` filtra por nombre sin distinguir mayúsculas ni acentos (spec 25).",
        parameters: [
          query("q", { type: "string", maxLength: 50 }, "Parte del nombre"),
          page,
          limit,
        ],
        responses: {
          200: ok("Una página de categorías", paginado("categorias", ref("Categoria"))),
          400: error("BadRequest"),
        },
      },
    },
  },
  schemas: {
    Categoria: {
      type: "object",
      properties: {
        id: { type: "integer", example: 1 },
        nombre: { type: "string", example: "Recitales" },
        descripcion: { type: "string", example: "Música en vivo" },
      },
    },
  },
};
