import { LIMITE_POR_PAGINA } from "../../validations/paginacionValidation.js";
import { schemasComunes, respuestasComunes, seguridad } from "./comun.js";
import sistema from "./sistema.js";
import auth from "./auth.js";
import categorias from "./categorias.js";
import eventos from "./eventos.js";
import organizadores from "./organizadores.js";
import compras from "./compras.js";
import favoritos from "./favoritos.js";
import mensajes from "./mensajes.js";
import direcciones from "./direcciones.js";

const modulos = [
  sistema,
  auth,
  categorias,
  eventos,
  direcciones,
  organizadores,
  compras,
  mensajes,
  favoritos,
];

export function unir(partes, clave) {
  const resultado = {};
  for (const parte of partes) {
    for (const [nombre, valor] of Object.entries(parte[clave] ?? {})) {
      if (nombre in resultado) throw new Error(`Swagger: "${nombre}" está definido en dos módulos`);
      resultado[nombre] = valor;
    }
  }
  return resultado;
}

const DESCRIPCION = `API de AI Ticket It: eventos, compras de entradas, chat de la compra, reseñas y favoritos.

Los ids son enteros positivos: un id inválido responde 400; uno que no existe, 404. Los listados se paginan con \`page\` y \`limit\` (20 por defecto, máximo ${LIMITE_POR_PAGINA}) y responden 400 ante un parámetro de query desconocido. Las fechas van en ISO 8601 UTC.

**Cómo probar los endpoints con sesión.** Llamá a \`POST /auth/login\` con un usuario del seed (todos con la clave \`Demo1234!\`): \`ana@aiticket.com\` y \`bruno@aiticket.com\` son compradores; \`fenix@aiticket.com\` y \`konex@aiticket.com\`, organizadores. Copiá el \`token\` de la respuesta y pegalo en **Authorize**.`;

export const openapi = {
  openapi: "3.0.3",
  info: { title: "AI Ticket It — API", version: "1.0.0", description: DESCRIPCION },
  servers: [{ url: "/", description: "Este servidor" }],
  tags: modulos.flatMap((modulo) => modulo.tags ?? []),
  paths: unir(modulos, "paths"),
  components: {
    schemas: unir([{ schemas: schemasComunes }, ...modulos], "schemas"),
    responses: respuestasComunes,
    securitySchemes: seguridad,
  },
};
