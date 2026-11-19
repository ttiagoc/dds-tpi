import { error, ok, conAuth } from "./comun.js";

export default {
  tags: [{ name: "Sistema", description: "Estado del servidor e imágenes" }],
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
    "/imagenes": {
      post: conAuth(
        {
          tags: ["Sistema"],
          summary: "Subir la foto de portada de un evento",
          description:
            "Multipart con el campo `imagen` (JPG, PNG o WEBP, hasta 5 MB). La url que devuelve se usa en `multimedia` al crear el evento. Las subidas viven en el disco del servidor y se pierden al redeployar, igual que los datos (ADR-013).",
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  required: ["imagen"],
                  properties: { imagen: { type: "string", format: "binary" } },
                },
              },
            },
          },
          responses: {
            201: ok("Imagen guardada", {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  example: "/imagenes/subidas/3f2a9c1e-0b5d-4e6a-9f7b-2c8d1a4e6b10.jpg",
                },
              },
            }),
            400: error("BadRequest"),
            413: {
              description: "La imagen pesa más de 5 MB",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
            },
          },
        },
        { rol: "ORGANIZADOR" },
      ),
    },
    "/imagenes/{archivo}": {
      get: {
        tags: ["Sistema"],
        summary: "Imagen de un evento (archivo estático del seed o subido)",
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
