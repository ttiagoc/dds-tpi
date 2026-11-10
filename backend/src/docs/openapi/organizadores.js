import { ref, ok, error, id, page, limit, paginado, extiende, conAuth } from "./comun.js";

export default {
  tags: [
    { name: "Organizadores", description: "Eventos propios y reputación de cada organizador" },
  ],
  paths: {
    "/organizadores/yo/eventos": {
      get: conAuth(
        {
          tags: ["Organizadores"],
          summary: "Listar mis eventos con vendidas, cupo y recaudado",
          description:
            "Incluye los eventos pasados, por fecha asc. `vendidas` es el cupo ocupado; `recaudado`, la suma de las compras CONFIRMADA y UTILIZADA.",
          parameters: [page, limit],
          responses: {
            200: ok("Página de mis eventos", paginado("eventos", ref("EventoDelOrganizador"))),
            400: error("BadRequest"),
          },
        },
        { rol: "ORGANIZADOR" },
      ),
    },
    "/organizadores/{id}/resenias": {
      parameters: [id("Id del organizador")],
      get: {
        tags: ["Organizadores"],
        summary: "Ver las reseñas de un organizador",
        description:
          'Público. Las reseñas van de la más nueva a la más vieja; `puntajePromedio` (1 decimal, R6) y `cantidadResenias` son sobre todas, no sobre la página. Si el id no es de un organizador, responde 404 "No existe el organizador".',
        parameters: [page, limit],
        responses: {
          200: ok("Reseñas del organizador", ref("ReseniasDelOrganizador")),
          400: error("BadRequest"),
          404: error("NotFound"),
        },
      },
    },
  },
  schemas: {
    EventoDelOrganizador: extiende("EventoResumen", {
      vendidas: { type: "integer", example: 20 },
      cupo: { type: "integer", example: 3020 },
      recaudado: { type: "number", example: 2820000 },
    }),
    ReseniasDelOrganizador: paginado("resenias", ref("Resenia"), {
      organizador: {
        type: "object",
        properties: {
          id: { type: "integer", example: 3 },
          nombre: { type: "string", example: "Fénix Producciones" },
          puntajePromedio: { type: "number", nullable: true, example: 4.5 },
          cantidadResenias: { type: "integer", example: 2 },
        },
      },
    }),
  },
};
