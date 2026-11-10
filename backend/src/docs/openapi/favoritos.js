import { ref, ok, error, eventoId, sinCuerpo, conAuth } from "./comun.js";

const COMPRADOR = { rol: "COMPRADOR" };

export default {
  tags: [{ name: "Favoritos", description: "Eventos guardados por el comprador" }],
  paths: {
    "/usuarios/yo/favoritos": {
      get: conAuth(
        {
          tags: ["Favoritos"],
          summary: "Listar mis favoritos",
          description:
            "Sin paginar. Incluye los eventos que ya ocurrieron, por fecha del evento asc.",
          responses: { 200: ok("Mis favoritos", { type: "array", items: ref("EventoResumen") }) },
        },
        COMPRADOR,
      ),
    },
    "/usuarios/yo/favoritos/{eventoId}": {
      parameters: [eventoId],
      put: conAuth(
        {
          tags: ["Favoritos"],
          summary: "Agregar un evento a favoritos",
          description:
            'Idempotente y admite eventos pasados. Un evento inexistente responde 404 "No existe el evento".',
          responses: {
            204: sinCuerpo("Agregado (o ya estaba)"),
            400: error("BadRequest"),
            404: error("NotFound"),
          },
        },
        COMPRADOR,
      ),
      delete: conAuth(
        {
          tags: ["Favoritos"],
          summary: "Quitar un evento de favoritos",
          description: "Idempotente: responde 204 aunque no fuera favorito o el evento no exista.",
          responses: { 204: sinCuerpo("Quitado (o no estaba)"), 400: error("BadRequest") },
        },
        COMPRADOR,
      ),
    },
  },
};
