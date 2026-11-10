import { ref, ok, error, body, id, fecha, texto, conAuth } from "./comun.js";

const PARTICIPANTE = { conPermiso: true };
const errores = { 400: error("BadRequest"), 404: error("NotFound") };

const DESCRIPCION = `Chat entre el comprador y el organizador del evento de cada compra. Solo participan ellos dos (403 para el resto) y se puede escribir en cualquier estado de la compra.

Se escribe por REST; las novedades en vivo llegan por Socket.io.`;

export default {
  tags: [{ name: "Chat", description: DESCRIPCION }],
  paths: {
    "/compras/{id}/mensajes": {
      parameters: [id("Id de la compra")],
      get: conAuth(
        {
          tags: ["Chat"],
          summary: "Leer el chat de una compra",
          description: "Sin paginar, en orden cronológico (enviado asc, id asc).",
          responses: {
            200: ok("Mensajes de la compra", { type: "array", items: ref("Mensaje") }),
            ...errores,
          },
        },
        PARTICIPANTE,
      ),
      post: conAuth(
        {
          tags: ["Chat"],
          summary: "Enviar un mensaje en el chat de una compra",
          description:
            "El body se valida antes que la compra: un mensaje inválido responde 400 aunque la compra no exista.",
          requestBody: body("MensajeInput"),
          responses: { 201: ok("Mensaje enviado", ref("Mensaje")), ...errores },
        },
        PARTICIPANTE,
      ),
    },
  },
  schemas: {
    MensajeInput: {
      type: "object",
      required: ["mensaje"],
      additionalProperties: false,
      properties: {
        mensaje: texto("¿A qué hora abren las puertas?", {
          minLength: 1,
          maxLength: 500,
          description: "Se recortan los espacios de los costados",
        }),
      },
    },
    Mensaje: {
      type: "object",
      properties: {
        id: { type: "integer", example: 1, description: "Correlativo dentro de la compra" },
        usuario: {
          type: "object",
          properties: {
            id: { type: "integer", example: 3 },
            nombre: texto("Ana Pérez"),
            rol: { type: "string", enum: ["COMPRADOR", "ORGANIZADOR"] },
          },
        },
        mensaje: texto("¿A qué hora abren las puertas?"),
        enviado: fecha,
      },
    },
  },
};
