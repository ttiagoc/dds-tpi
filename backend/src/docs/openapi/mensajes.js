import {
  ref,
  ok,
  error,
  body,
  id,
  fecha,
  texto,
  conAuth,
  query,
  page,
  limit,
  paginado,
  sinCuerpo,
  ESTADOS,
} from "./comun.js";
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
| server → room \`compra:<id>\` | \`compra:estado\` | \`{ compraId, estado }\` tras pagar, cancelar o marcar utilizada; un solo evento con el estado final |
| server → room \`usuario:<id>\` | \`conversacion:actualizada\` | \`{ compraId, ultimoMensaje, noLeidos }\` a la otra parte tras un mensaje; cada socket entra solo a su sala de usuario al conectarse |

**No leídos** (R11): cada participante tiene una marca "leído hasta"; sus no leídos son los mensajes de la otra parte posteriores a esa marca. Escribir avanza la marca del autor.`;

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
    "/compras/{id}/mensajes/leidos": {
      parameters: [id("Id de la compra")],
      put: conAuth(
        {
          tags: ["Chat"],
          summary: "Marcar como leído el chat de una compra",
          description: "Lleva tu marca de lectura al último mensaje. Idempotente.",
          responses: { 204: sinCuerpo("Marcado como leído"), ...errores },
        },
        PARTICIPANTE,
      ),
    },
    "/usuarios/yo/conversaciones": {
      get: conAuth({
        tags: ["Chat"],
        summary: "Listar mis conversaciones",
        description:
          "Compras con al menos un mensaje en las que participás (comprador: tus compras; organizador: las de tus eventos), primero la del mensaje más reciente (R12). `totalNoLeidos` suma todas, no solo la página.",
        parameters: [page, limit],
        responses: {
          200: ok(
            "Mis conversaciones",
            paginado("conversaciones", ref("Conversacion"), {
              totalNoLeidos: { type: "integer", example: 3 },
            }),
          ),
          400: error("BadRequest"),
        },
      }),
    },
  },
  schemas: {
    Conversacion: {
      type: "object",
      properties: {
        compraId: { type: "integer", example: 7 },
        estado: { type: "string", enum: ESTADOS },
        evento: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            nombre: texto("Los Piojos en River"),
            imagen: texto("/imagenes/piojos.jpg", { nullable: true }),
          },
        },
        contraparte: {
          type: "object",
          properties: { id: { type: "integer", example: 2 }, nombre: texto("Fénix Producciones") },
        },
        ultimoMensaje: ref("Mensaje"),
        noLeidos: { type: "integer", example: 1 },
      },
    },
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
