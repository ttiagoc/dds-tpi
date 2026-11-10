import { ok } from "./comun.js";

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
  },
};
