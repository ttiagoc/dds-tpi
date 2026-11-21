import { conAuth, error, ok, query, ref } from "./comun.js";

const requerido = (nombre, schema, descripcion) => ({
  ...query(nombre, schema, descripcion),
  required: true,
});
const texto = (ejemplo) => ({ type: "string", minLength: 1, maxLength: 100, example: ejemplo });

const parametros = [
  requerido("calle", texto("Sarmiento"), "Calle"),
  requerido("numero", { type: "integer", minimum: 1, maximum: 99999, example: 3131 }, "Altura"),
  requerido("localidad", texto("Balvanera"), "Localidad o barrio"),
  requerido(
    "provincia",
    texto("Ciudad Autónoma de Buenos Aires"),
    "Provincia, como la nombra Georef",
  ),
];

export default {
  tags: [{ name: "Direcciones", description: "Ubicar una dirección antes de publicar un evento" }],
  paths: {
    "/direcciones/ubicacion": {
      get: conAuth(
        {
          tags: ["Direcciones"],
          summary: "Ubicar una dirección en el mapa",
          description:
            "Vista previa para que el organizador confirme la ubicación antes de publicar (spec 31). Arma `direccion` como 'calle número, localidad, provincia' y la geocodifica con Georef (ADR-014). `POST /eventos` vuelve a geocodificar al publicar.",
          parameters: parametros,
          responses: {
            200: ok("Dirección ubicada", ref("Ubicacion")),
            400: error("BadRequest"),
            422: error("UnprocessableEntity"),
            503: error("ServiceUnavailable"),
          },
        },
        { rol: "ORGANIZADOR" },
      ),
    },
  },
  schemas: {
    Ubicacion: {
      type: "object",
      properties: {
        direccion: {
          type: "string",
          example: "Sarmiento 3131, Balvanera, Ciudad Autónoma de Buenos Aires",
        },
        latitud: { type: "number", example: -34.6067 },
        longitud: { type: "number", example: -58.4104 },
      },
    },
  },
};
