import { ref, ok } from "./comun.js";

export default {
  tags: [{ name: "Categorías", description: "Categorías para filtrar eventos" }],
  paths: {
    "/categorias": {
      get: {
        tags: ["Categorías"],
        summary: "Listar categorías",
        responses: { 200: ok("Todas las categorías", { type: "array", items: ref("Categoria") }) },
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
