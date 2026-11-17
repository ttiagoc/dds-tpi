import { EstadoCompra } from "../../domain/EstadoCompra.js";
import { LIMITE_POR_PAGINA } from "../../validations/paginacionValidation.js";

export const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });
export const json = (schema) => ({ "application/json": { schema } });
export const ok = (description, schema) => ({ description, content: json(schema) });
export const error = (nombre) => ({ $ref: `#/components/responses/${nombre}` });
export const body = (nombre) => ({ required: true, content: json(ref(nombre)) });
export const sinCuerpo = (description) => ({ description });
export const extiende = (nombre, properties) => ({
  allOf: [ref(nombre), { type: "object", properties }],
});

const idPath = (name, description) => ({
  name,
  in: "path",
  required: true,
  description: `${description}. Si no es un entero positivo, responde 400.`,
  schema: { type: "integer", minimum: 1, example: 1 },
});
export const id = (description) => idPath("id", description);
export const eventoId = idPath("eventoId", "Id del evento");

export const query = (name, schema, description) => ({ name, in: "query", schema, description });
const entero = (minimum, extra = {}) => ({ type: "integer", minimum, ...extra });
export const page = query("page", entero(1, { default: 1 }));
export const limit = query("limit", entero(1, { maximum: LIMITE_POR_PAGINA, default: 20 }));

export const ESTADOS = Object.values(EstadoCompra);
export const estado = query("estado", { type: "string", enum: ESTADOS }, "Filtra por estado");

export const paginado = (clave, items, extra = {}) => ({
  type: "object",
  properties: {
    ...extra,
    [clave]: { type: "array", items },
    total: { type: "integer", example: 12 },
    page: { type: "integer", example: 1 },
    totalPages: { type: "integer", example: 1, description: "0 si no hay resultados" },
  },
});

export const fecha = { type: "string", format: "date-time", example: "2026-11-27T23:00:00.000Z" };
export const fechaFutura = { ...fecha, example: "2030-12-05T22:00:00.000Z" };
export const texto = (example, extra = {}) => ({ type: "string", example, ...extra });
export const nombreConId = (example, { idEjemplo = 1, nullable = false } = {}) => ({
  type: "object",
  properties: {
    id: { type: "integer", example: idEjemplo },
    nombre: texto(example, nullable ? { nullable: true } : {}),
  },
});

export const propiedadesEvento = {
  id: { type: "integer", example: 1 },
  nombre: texto("Los Piojos en River"),
  fecha,
  lugar: texto("Estadio River Plate"),
  imagen: texto("/imagenes/piojos.jpg", { nullable: true }),
};

function conAviso(operacion, aviso) {
  const description = operacion.description ? `${aviso} ${operacion.description}` : aviso;
  return { ...operacion, description };
}

export function conAuth(operacion, { rol = null, conPermiso = rol != null } = {}) {
  const aviso = rol ? `**Solo ${rol}.**` : "**Requiere sesión.**";
  const responses = { ...operacion.responses, 401: error("Unauthorized") };
  if (conPermiso) responses[403] = error("Forbidden");
  return { ...conAviso(operacion, aviso), security: [{ bearerAuth: [] }], responses };
}

export function conAuthOpcional(operacion) {
  return {
    ...conAviso(operacion, "**Sesión opcional.**"),
    security: [{}, { bearerAuth: [] }],
  };
}

export const schemasComunes = {
  Error: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: ["fail", "error"],
        description: "`fail` para errores 4xx, `error` para 5xx",
      },
      message: texto("No tenés permiso para realizar esta acción"),
      details: {
        type: "array",
        description: "Detalle de la validación de zod, solo en los 400 de body o query",
        items: {
          type: "object",
          properties: {
            campo: texto("cantidad"),
            mensaje: texto("Demasiado grande: se esperaba que número fuera <=10"),
          },
        },
      },
      timestamp: fecha,
    },
  },
};

export const respuestaDeError = (description) => ({ description, content: json(ref("Error")) });

export const respuestasComunes = {
  BadRequest: respuestaDeError("Body, query o id con formato inválido"),
  Unauthorized: respuestaDeError("Falta el token, es inválido o expiró"),
  Forbidden: respuestaDeError("Tu rol no puede usar este endpoint, o el recurso no es tuyo"),
  NotFound: respuestaDeError("El recurso no existe"),
  Conflict: respuestaDeError("El recurso ya existe (por ejemplo, una reseña repetida)"),
  UnprocessableEntity: respuestaDeError("Se viola una regla de negocio"),
};

export const seguridad = {
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "El token que devuelve `POST /auth/login`",
  },
};
