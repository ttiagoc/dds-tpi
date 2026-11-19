import { ref, ok, error, body, id, fecha, texto, conAuth, query } from "./comun.js";
import { LIMITE_POR_PAGINA } from "../../validations/paginacionValidation.js";
import { MENSAJES_POR_PAGINA } from "../../validations/mensajesQueryValidation.js";

const PARTICIPANTE = { conPermiso: true };
const errores = { 400: error("BadRequest"), 404: error("NotFound") };

const DESCRIPCION = `Chat entre el comprador y el organizador del evento de cada compra. Solo participan ellos dos (403 para el resto) y se puede escribir en cualquier estado de la compra.

Se escribe por REST; las novedades en vivo llegan por Socket.io (OpenAPI no modela sockets, por eso van acá).

**Socket.io** (mismo host y puerto que la API): conectarse con \`io(API_URL, { auth: { token } })\`. Sin token válido, \`connect_error\` con \`message: "No autenticado"\`.

| Dirección | Evento | Payload |
|---|---|---|
| cliente → server | \`compra:unirse\` | \`{ compraId }\`, con ack \`{ ok: true }\` o \`{ ok: false, error }\` (id inválido, compra inexistente o no participás) |
| cliente → server | \`compra:salir\` | \`{ compraId }\` |
| server → room \`compra:<id>\` | \`mensaje:nuevo\` | \`Mensaje\`, igual que el 201 del POST; llega a todo el room, incluido el autor |
| server → room \`compra:<id>\` | \`compra:estado\` | \`{ compraId, estado }\` tras pagar, cancelar o marcar utilizada; un solo evento con el estado final |`;

export default {
  tags: [{ name: "Chat", description: DESCRIPCION }],
  paths: {
    "/compras/{id}/mensajes": {
      parameters: [id("Id de la compra")],
      get: conAuth(
        {
          tags: ["Chat"],
          summary: "Leer el chat de una compra",
          description:
            "Pagina hacia atrás: sin `antesDe` trae los mensajes más recientes; con `antesDe` trae los anteriores a ese id. Cada página va en orden cronológico (enviado asc, id asc). Un parámetro desconocido responde 400.",
          parameters: [
            query(
              "antesDe",
              { type: "integer", minimum: 1 },
              "Id del mensaje más viejo que ya tenés: trae los anteriores",
            ),
            query("limit", {
              type: "integer",
              minimum: 1,
              maximum: LIMITE_POR_PAGINA,
              default: MENSAJES_POR_PAGINA,
            }),
          ],
          responses: {
            200: ok("Página de mensajes de la compra", {
              type: "object",
              properties: {
                mensajes: { type: "array", items: ref("Mensaje") },
                hayMas: { type: "boolean", description: "Quedan mensajes más viejos" },
              },
            }),
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
