import { error, ok } from "./comun.js";

export default {
  tags: [{ name: "Sistema", description: "Estado del servidor" }],
  paths: {
    "/healthcheck": {
      get: {
        tags: ["Sistema"],
        summary: "Verificar que la API responde",
        responses: {
          200: ok("La API está levantada", {
            type: "object",
            properties: { status: { type: "string", example: "ok" } },
          }),
        },
      },
    },
    "/imagenes/{archivo}": {
      get: {
        tags: ["Sistema"],
        summary: "Imagen de un evento del seed (archivo estático)",
        parameters: [
          {
            name: "archivo",
            in: "path",
            required: true,
            schema: { type: "string", example: "rock.jpg" },
          },
        ],
        responses: {
          200: {
            description: "La imagen",
            content: { "image/jpeg": { schema: { type: "string", format: "binary" } } },
          },
          404: error("NotFound"),
        },
      },
    },
  },
};
