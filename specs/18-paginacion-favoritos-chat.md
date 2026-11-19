# Spec 18 — Paginación de favoritos y del historial del chat

- **Estado:** implementada
- **Rama:** `feature/paginacion-favoritos-chat`
- **Casos de uso:** CU5, CU6 (chat), extra favoritos (ver `planes/00-indice.md`)
- **Iteración:** It5b (rediseño)
- **Depende de:** spec 07 (favoritos), spec 08 (chat REST), spec 10d (Favoritos), spec 12 (Chat)

## Contexto
Todos los listados de la API paginan con `page`/`limit` salvo dos: `GET /usuarios/yo/favoritos` devuelve todos los favoritos y el front los muestra como una sola página, y `GET /compras/:id/mensajes` devuelve el historial completo del chat. Con muchos favoritos o una conversación larga, la respuesta crece sin límite. Esta spec unifica el criterio: favoritos pagina igual que el resto, y el chat pagina hacia atrás con un cursor, que es como se lee una conversación.

## Historias
- Como comprador, quiero que Favoritos cargue de a 10 y traiga más al llegar al final, como Explorar.
- Como participante de un chat largo, quiero ver primero los mensajes más recientes y poder traer los anteriores.

## Reglas de negocio
Sin reglas de dominio nuevas (R7 sigue igual). Reglas de paginación:

- **RP1 Favoritos.** `GET /usuarios/yo/favoritos` acepta `page` y `limit` (mismos defaults y tope que el resto: 1, 20, máx. 50) y responde `{ eventos, total, page, totalPages }`. Orden sin cambios (fecha del evento asc, id asc).
- **RP2 Chat por cursor.** `GET /compras/:id/mensajes` acepta `antesDe` (id de mensaje, entero positivo, opcional) y `limit` (1-50, default 30). Devuelve los `limit` mensajes más recientes con `id < antesDe` (o los más recientes de todos si no viene `antesDe`), en orden cronológico asc, y `hayMas: true` si quedan mensajes más viejos. Se usa el `id` como cursor porque dentro de una compra los ids son correlativos y siguen el orden de envío.
- **RP3** Query desconocida → 400 (`.strict()`), igual que el resto.

## Contrato de API
| Método | Ruta | Cambio |
|---|---|---|
| GET | `/usuarios/yo/favoritos` | query `page, limit`; respuesta `{ eventos: [EventoResumen], total, page, totalPages }` (antes `[EventoResumen]`) |
| GET | `/compras/:id/mensajes` | query `antesDe?, limit?`; respuesta `{ mensajes: [Mensaje], hayMas }` (antes `[Mensaje]`) |

Errores nuevos: 400 por query inválida en los dos. Se actualizan `planes/03` y Swagger.

## Pantallas
- **Favoritos**: usa `paginaDe(listarFavoritos, "eventos")` con `useListaPaginada`, "cargar más" (`cargar-mas`) y pull-to-refresh como Explorar. Sin cambios de testIDs.
- **Chat**: carga la última página. Si `hayMas`, arriba de la lista se ve "Ver mensajes anteriores" (`chat-ver-anteriores`), que pide `antesDe = id del mensaje más viejo cargado` y antepone el resultado sin mover la vista al final. Mientras carga, el botón queda en `loading`. Si falla, error en línea con el texto del back (`chat-anteriores-error`). La recarga al reconectar y "Actualizar" piden solo la última página y la unen con lo que ya estaba (dedupe por `id`); no se pierden los anteriores ya cargados.

## Criterios de aceptación
```gherkin
Escenario: favoritos paginados
  Dado que Ana tiene 12 favoritos
  Cuando pide GET /usuarios/yo/favoritos?limit=10
  Entonces recibe 10 eventos, total 12, page 1 y totalPages 2

Escenario: query inválida en favoritos
  Cuando Ana pide GET /usuarios/yo/favoritos?limit=0
  Entonces recibe 400

Escenario: última página del chat
  Dado una compra con 35 mensajes
  Cuando un participante pide GET /compras/:id/mensajes
  Entonces recibe los mensajes 6 a 35 en orden y hayMas true

Escenario: página anterior del chat
  Dado una compra con 35 mensajes
  Cuando pide GET /compras/:id/mensajes?antesDe=6
  Entonces recibe los mensajes 1 a 5 y hayMas false

Escenario: cursor inválido
  Cuando pide GET /compras/:id/mensajes?antesDe=abc
  Entonces recibe 400

Escenario: ver anteriores en la app
  Dado que abro un chat con más de 30 mensajes
  Cuando toco "Ver mensajes anteriores"
  Entonces aparecen los mensajes más viejos arriba y el botón desaparece si no hay más
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit service | `FavoritoService.listar` pagina; `MensajeService.listar` con y sin `antesDe`, `hayMas` en el borde exacto |
| Unit validación | `mensajesQueryValidation` (antesDe, limit, strict) |
| Integración | favoritos paginados + 400; mensajes por cursor + 400 + 403/404 siguen igual |
| Front (RNTL) | Favoritos carga más; Chat muestra y usa "Ver mensajes anteriores", conserva anteriores al recargar |
| E2E | `chat-compra` sigue verde |

## Fuera de alcance
- Scroll infinito automático hacia arriba en el chat (se usa botón).
- Paginar `GET /organizadores/:id/resenias` en DetalleEvento (ya pagina en la API; la pantalla pide 3).

## Notas de IA
La IA relevó qué listados no paginaban y propuso cursor en el chat en vez de `page` porque los mensajes nuevos corren las páginas. El usuario eligió paginar los dos.
