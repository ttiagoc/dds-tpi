import { MAXIMO_ENTRADAS_POR_COMPRA } from "../../validations/crearCompraValidation.js";
import {
  ref,
  ok,
  error,
  body,
  id,
  page,
  limit,
  estado,
  ESTADOS,
  paginado,
  extiende,
  fecha,
  texto,
  nombreConId,
  propiedadesEvento,
  conAuth,
  numeroDeEntrada,
} from "./comun.js";

const COMPRADOR = { rol: "COMPRADOR" };
const idCompra = id("Id de la compra");
const errores = {
  400: error("BadRequest"),
  404: error("NotFound"),
  422: error("UnprocessableEntity"),
};

const AVISO_SOCKET =
  "Después de guardar, emite `compra:estado` `{ compraId, estado }` con el estado final al room `compra:<id>` de Socket.io (ver tag Chat).";

const accion = ({ summary, description }, rol) =>
  conAuth(
    {
      tags: ["Compras"],
      summary,
      description: `${description} ${AVISO_SOCKET}`,
      responses: { 200: ok("Compra actualizada", ref("CompraDetalle")), ...errores },
    },
    { rol },
  );

const booleano = { type: "boolean" };
const anaPerez = nombreConId("Ana Pérez");

export default {
  tags: [{ name: "Compras", description: "Compras de entradas y su ciclo de vida" }],
  paths: {
    "/compras": {
      get: conAuth(
        {
          tags: ["Compras"],
          summary: "Listar mis compras",
          description:
            "Primero las de eventos que no ocurrieron (el más cercano arriba) y después las pasadas (la más reciente arriba).",
          parameters: [estado, page, limit],
          responses: {
            200: ok("Página de mis compras", paginado("compras", ref("CompraResumen"))),
            400: error("BadRequest"),
          },
        },
        COMPRADOR,
      ),
      post: conAuth(
        {
          tags: ["Compras"],
          summary: "Comprar entradas",
          description:
            "Crea la compra PENDIENTE y reserva el cupo. 404 si el evento o el tipo no existen; 422 si no hay cupo o el evento ya ocurrió.",
          requestBody: body("CompraInput"),
          responses: { 201: ok("Compra creada", ref("CompraDetalle")), ...errores },
        },
        COMPRADOR,
      ),
    },
    "/compras/{id}": {
      parameters: [idCompra],
      get: conAuth(
        {
          tags: ["Compras"],
          summary: "Ver el detalle de una compra",
          description:
            "La ven el comprador y el organizador del evento; las `acciones` se calculan para quien pide.",
          responses: {
            200: ok("Compra", ref("CompraDetalle")),
            400: error("BadRequest"),
            404: error("NotFound"),
          },
        },
        { conPermiso: true },
      ),
    },
    "/compras/{id}/pago": {
      parameters: [idCompra],
      post: accion(
        {
          summary: "Pagar una compra",
          description:
            "Pasa de PENDIENTE a CONFIRMADA. 422 si no está pendiente o el evento ya ocurrió.",
        },
        "COMPRADOR",
      ),
    },
    "/compras/{id}/cancelacion": {
      parameters: [idCompra],
      post: accion(
        {
          summary: "Cancelar una compra",
          description:
            "Libera el cupo. Si estaba CONFIRMADA queda REEMBOLSADA; si estaba PENDIENTE, CANCELADA. 422 si ya fue utilizada, si ya está cancelada o si el evento ocurrió.",
        },
        "COMPRADOR",
      ),
    },
    "/compras/{id}/uso": {
      parameters: [idCompra],
      post: accion(
        {
          summary: "Marcar una compra como utilizada",
          description:
            'Solo el organizador del evento (403 si es de otro). Pasa de CONFIRMADA a UTILIZADA, marca como usadas todas las entradas y habilita la reseña; se permite antes de la fecha del evento. Desde otro estado responde 422 (por ejemplo, "No se puede pasar de PENDIENTE a UTILIZADA").',
        },
        "ORGANIZADOR",
      ),
    },
    "/compras/{id}/entradas/{numero}/uso": {
      parameters: [idCompra, numeroDeEntrada],
      post: accion(
        {
          summary: "Validar una entrada de la compra",
          description:
            'Solo el organizador del evento (403 si es de otro). Usa esa entrada; la primera validada pasa la compra de CONFIRMADA a UTILIZADA (R17). 404 "No existe la entrada" si el número está fuera de rango; 422 "La compra todavía no está pagada", "La compra está cancelada" o "Esta entrada ya fue utilizada". Solo emite `compra:estado` si la compra cambió de estado.',
        },
        "ORGANIZADOR",
      ),
    },
    "/compras/{id}/resenia": {
      parameters: [idCompra],
      post: conAuth(
        {
          tags: ["Compras"],
          summary: "Reseñar una compra utilizada",
          description:
            'Orden de los chequeos: 404 compra inexistente, 403 no es tuya, 409 "Ya reseñaste esta compra", 422 "Solo podés reseñar una compra utilizada".',
          requestBody: body("ReseniaInput"),
          responses: {
            201: ok("Reseña creada", ref("Resenia")),
            ...errores,
            409: error("Conflict"),
          },
        },
        COMPRADOR,
      ),
    },
  },
  schemas: {
    CompraInput: {
      type: "object",
      required: ["eventoId", "tipoEntradaId", "cantidad"],
      additionalProperties: false,
      properties: {
        eventoId: { type: "integer", minimum: 1, example: 1 },
        tipoEntradaId: { type: "integer", minimum: 1, example: 1 },
        cantidad: {
          type: "integer",
          minimum: 1,
          maximum: MAXIMO_ENTRADAS_POR_COMPRA,
          example: 2,
        },
      },
    },
    CompraResumen: {
      type: "object",
      properties: {
        id: { type: "integer", example: 7 },
        estado: { type: "string", enum: ESTADOS },
        cantidad: { type: "integer", example: 2 },
        total: { type: "number", example: 90000 },
        fechaCompra: fecha,
        diasRestantes: {
          type: "integer",
          nullable: true,
          description: "Solo en compras CONFIRMADA; null en el resto",
        },
        evento: { type: "object", properties: propiedadesEvento },
        tipoEntrada: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            nombre: texto("Campo"),
            precio: { type: "number", example: 45000 },
          },
        },
        comprador: anaPerez,
        acciones: {
          type: "object",
          description: "Calculadas para quien pide; el front no reimplementa las reglas",
          properties: {
            puedePagar: booleano,
            puedeCancelar: booleano,
            puedeMarcarUtilizada: booleano,
            puedeReseniar: booleano,
          },
        },
      },
    },
    CompraDetalle: extiende("CompraResumen", {
      historial: {
        type: "array",
        items: {
          type: "object",
          properties: {
            estado: { type: "string", enum: ESTADOS },
            quien: nombreConId("Ana Pérez", { nullable: true }),
            fechaHora: fecha,
          },
        },
      },
      resenia: {
        type: "object",
        nullable: true,
        properties: {
          puntuacion: { type: "integer", example: 5 },
          detalle: texto("Un show inolvidable"),
        },
      },
      entradas: {
        type: "array",
        description: "Una por unidad comprada (R16)",
        items: {
          type: "object",
          properties: {
            numero: { type: "integer", example: 1 },
            fechaUso: { ...fecha, nullable: true },
            puedeValidarse: {
              ...booleano,
              description:
                "Solo true para el organizador del evento, con la compra CONFIRMADA o UTILIZADA y la entrada sin usar",
            },
          },
        },
      },
    }),
    ReseniaInput: {
      type: "object",
      required: ["puntuacion", "detalle"],
      additionalProperties: false,
      properties: {
        puntuacion: { type: "integer", minimum: 1, maximum: 5, example: 5 },
        detalle: texto("Genial", { minLength: 1, maxLength: 500 }),
      },
    },
    Resenia: {
      type: "object",
      properties: {
        id: { type: "integer", example: 5 },
        compraId: { type: "integer", example: 7 },
        puntuacion: { type: "integer", example: 5 },
        detalle: texto("Un show inolvidable, el sonido impecable."),
        fecha,
        evento: nombreConId("Rock en el Parque"),
        comprador: { type: "object", properties: { nombre: texto("Ana Pérez") } },
      },
    },
  },
};
