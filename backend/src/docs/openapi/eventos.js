import {
  ref,
  ok,
  error,
  body,
  id,
  query,
  page,
  limit,
  estado,
  paginado,
  extiende,
  fechaFutura,
  texto,
  nombreConId,
  propiedadesEvento,
  conAuth,
  conAuthOpcional,
} from "./comun.js";

const precio = { type: "number", minimum: 0 };

const parametrosBusqueda = [
  query(
    "q",
    { type: "string", maxLength: 100 },
    "Busca en el nombre y la descripción, sin distinguir mayúsculas ni acentos",
  ),
  query(
    "categoria",
    { type: "integer", minimum: 1 },
    "Id de categoría; si no existe, la lista viene vacía",
  ),
  query("precioMin", precio, "Precio mínimo de algún tipo de entrada"),
  query(
    "precioMax",
    precio,
    "Precio máximo de algún tipo de entrada. Con los dos, un mismo tipo tiene que estar dentro del rango; si es menor que precioMin, responde 400",
  ),
  query("ordenarPor", { type: "string", enum: ["fecha", "precio", "puntaje"], default: "fecha" }),
  query(
    "orden",
    { type: "string", enum: ["asc", "desc"] },
    "`asc` por defecto; `desc` por defecto si se ordena por puntaje. Los organizadores sin reseñas van al final",
  ),
  query("incluirPasados", { type: "string", enum: ["true", "false"], default: "false" }),
  page,
  limit,
];

const REGLAS_DEL_ALTA = [
  "La fecha tiene que ser futura y los nombres de tipo de entrada, únicos (sin distinguir mayúsculas ni acentos) (R8).",
  "El nombre va de 3 a 100 caracteres; descripción, lugar y nombre de cada tipo no pueden estar vacíos; el precio no puede ser negativo y el cupo es un entero mayor a 0.",
  'Esas reglas las valida el dominio y responden 422, igual que una categoría inexistente ("La categoría no existe"). Un campo con tipo incorrecto, de más o faltante responde 400.',
].join(" ");

export default {
  tags: [{ name: "Eventos", description: "Catálogo de eventos y gestión del organizador" }],
  paths: {
    "/eventos": {
      get: conAuthOpcional({
        tags: ["Eventos"],
        summary: "Buscar eventos",
        description:
          "Por defecto solo trae eventos que todavía no ocurrieron (R10). Con sesión de comprador, `esFavorito` marca sus favoritos. Un parámetro desconocido responde 400.",
        parameters: parametrosBusqueda,
        responses: {
          200: ok("Página de eventos", paginado("eventos", ref("EventoResumen"))),
          400: error("BadRequest"),
        },
      }),
      post: conAuth(
        {
          tags: ["Eventos"],
          summary: "Crear un evento",
          description: REGLAS_DEL_ALTA,
          requestBody: body("EventoInput"),
          responses: {
            201: ok("Evento creado", ref("EventoDetalle")),
            400: error("BadRequest"),
            422: error("UnprocessableEntity"),
          },
        },
        { rol: "ORGANIZADOR" },
      ),
    },
    "/eventos/{id}": {
      parameters: [id("Id del evento")],
      get: conAuthOpcional({
        tags: ["Eventos"],
        summary: "Ver el detalle de un evento",
        responses: {
          200: ok("Evento", ref("EventoDetalle")),
          400: error("BadRequest"),
          404: error("NotFound"),
        },
      }),
    },
    "/eventos/{id}/compras": {
      parameters: [id("Id del evento")],
      get: conAuth(
        {
          tags: ["Eventos"],
          summary: "Ver las compras de un evento propio y su disponibilidad",
          description:
            "404 si el evento no existe y 403 si es de otro organizador (R9). La `disponibilidad` muestra el total de cada tipo, sin aplicar el filtro de `estado`. Las compras van de la más nueva a la más vieja.",
          parameters: [estado, page, limit],
          responses: {
            200: ok("Compras del evento", ref("ComprasDelEvento")),
            400: error("BadRequest"),
            404: error("NotFound"),
          },
        },
        { rol: "ORGANIZADOR" },
      ),
    },
  },
  schemas: {
    EventoResumen: {
      type: "object",
      properties: {
        ...propiedadesEvento,
        categoria: nombreConId("Recitales"),
        precioDesde: { type: "number", example: 45000 },
        organizador: {
          type: "object",
          properties: {
            id: { type: "integer", example: 3 },
            nombre: texto("Fénix Producciones"),
            puntajePromedio: { type: "number", nullable: true, example: 4.5 },
          },
        },
        esFavorito: { type: "boolean", description: "Siempre false sin sesión de comprador" },
      },
    },
    EventoDetalle: extiende("EventoResumen", {
      descripcion: { type: "string" },
      multimedia: { type: "array", items: { type: "string" } },
      tiposEntrada: { type: "array", items: ref("TipoEntrada") },
    }),
    TipoEntrada: {
      type: "object",
      properties: {
        id: { type: "integer", example: 1 },
        nombre: texto("Campo"),
        descripcion: texto("De pie"),
        precio: { type: "number", example: 45000 },
        cupo: { type: "integer", example: 500 },
        disponibles: { type: "integer", example: 498 },
      },
    },
    EventoInput: {
      type: "object",
      required: ["nombre", "descripcion", "categoriaId", "fecha", "lugar", "tiposEntrada"],
      additionalProperties: false,
      properties: {
        nombre: texto("Stand-up en el Konex", { minLength: 3, maxLength: 100 }),
        descripcion: texto("Una noche de humor", { minLength: 1, maxLength: 2000 }),
        categoriaId: { type: "integer", minimum: 1, example: 6 },
        fecha: fechaFutura,
        lugar: texto("Ciudad Cultural Konex", { minLength: 1 }),
        multimedia: {
          type: "array",
          maxItems: 5,
          items: { type: "string", format: "uri", description: "URL http o https" },
        },
        tiposEntrada: { type: "array", minItems: 1, maxItems: 10, items: ref("TipoEntradaInput") },
      },
    },
    TipoEntradaInput: {
      type: "object",
      required: ["nombre", "precio", "cupo"],
      additionalProperties: false,
      properties: {
        nombre: texto("General", { minLength: 1 }),
        descripcion: { type: "string", maxLength: 200 },
        precio: { type: "number", minimum: 0, example: 15000 },
        cupo: { type: "integer", minimum: 1, example: 200 },
      },
    },
    ComprasDelEvento: paginado("compras", ref("CompraResumen"), {
      evento: nombreConId("Festival Primavera Sonora", { idEjemplo: 2 }),
      disponibilidad: {
        type: "array",
        items: {
          type: "object",
          properties: {
            tipoEntradaId: { type: "integer", example: 2 },
            nombre: texto("VIP"),
            cupo: { type: "integer", example: 20 },
            vendidas: { type: "integer", example: 18 },
            disponibles: { type: "integer", example: 2 },
          },
        },
      },
    }),
  },
};
