# Spec 22 — Rediseño de pantallas

- **Estado:** implementada
- **Rama:** `feature/rediseno-pantallas`
- **Casos de uso:** todos los de la app (ver `planes/00-indice.md`)
- **Iteración:** It5b (rediseño)
- **Depende de:** spec 19 (identidad visual), specs 20 y 21
- **Maquetas:** https://claude.ai/artifact/Hd8WR9Hc3rjSkCYGqdRw8e

## Contexto
Con la identidad de la spec 19, las pantallas cambian de color y forma pero conservan la estructura genérica (títulos en el encabezado nativo, botones apilados, varias acciones con el mismo peso). Esta spec lleva cada pantalla a lo que muestran las maquetas: menos elementos, una acción principal por pantalla y jerarquía clara.

## Historias
- Como usuario, quiero entender cada pantalla de un vistazo y saber qué hacer después.

## Reglas de negocio
Sin reglas de dominio nuevas. Reglas de pantalla:

- **RR1 Encabezados.** Las pestañas muestran un título grande propio (800, 28) en el contenido; Explorar y Mis eventos agregan "Hola, <nombre>" arriba. El encabezado nativo de las pestañas se oculta.
- **RR2 Una acción principal.** Cada pantalla tiene como máximo un botón relleno con el acento; el resto son secundarios (borde o texto).
- **RR3 DetalleEvento.** Foto a todo el ancho arriba, con Volver y Favorito flotando; contenido en una hoja con borde superior redondeado; organizador en una fila separada por bordes; tipos de entrada como tarjetas de solo lectura con precio y disponibilidad; barra inferior fija con "Desde $X" y "Comprar" (abre Comprar, sin cambios de flujo).
- **RR4 Comprar.** Tipos como tarjetas seleccionables (borde de tinta en el elegido); barra inferior fija con el total y "Confirmar compra".
- **RR5 DetalleCompra.** Tarjeta de entrada grande (como la de la lista) arriba; acciones: la principal según el estado (Pagar / Reseñar / Marcar utilizada), Chat y Cancelar como secundarias.
- **RR6 Mis eventos.** Arriba, dos tarjetas de resumen: recaudado y entradas vendidas de **todos** los eventos del organizador; cada evento con barra de cupo (tinta, o acento si está agotado). FAB "Nuevo evento" en píldora.
- **RR7 Chat.** Encabezado con la contraparte, el evento, el número de compra y la píldora de estado; burbujas propias en tinta y ajenas en superficie con borde; separadores de día ("Hoy", "Ayer", fecha); input en píldora y botón de enviar redondo con el acento.
- **RR8 Login, Perfil, Favoritos, Reseñar, ComprasDelEvento, CrearEvento:** mismos componentes y reglas RR1-RR2, sin cambios de flujo.

## Contrato de API
Un cambio para RR6:

| Método | Ruta | Cambio |
|---|---|---|
| GET | `/organizadores/yo/eventos` | la respuesta suma `resumen: { recaudado, vendidas }` calculado sobre todos los eventos del organizador (no solo la página) |

## Pantallas
Todas las de `planes/04`. testIDs sin cambios; nuevos: `resumen-recaudado`, `resumen-vendidas` (Mis eventos), `evento-barra-comprar` (DetalleEvento), `chat-dia-<fecha>` (Chat).

## Criterios de aceptación
```gherkin
Escenario: resumen del organizador
  Dado que Fénix tiene más eventos que los que entran en una página
  Cuando abre Mis eventos
  Entonces el resumen suma todos sus eventos, no solo los de la primera página

Escenario: comprar desde el detalle
  Dado que estoy en el detalle de un evento con entradas
  Cuando toco "Comprar" en la barra inferior
  Entonces voy a Comprar como antes

Escenario: evento agotado
  Dado un evento sin entradas disponibles
  Cuando veo su detalle
  Entonces la barra inferior muestra "Agotado" deshabilitado

Escenario: días en el chat
  Dado mensajes de ayer y de hoy
  Cuando abro el chat
  Entonces veo los separadores "Ayer" y "Hoy"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit service | `EventoService.listarDelOrganizador` arma `resumen` sobre todos los eventos |
| Integración | `GET /organizadores/yo/eventos` incluye `resumen` |
| Front (RNTL) | tests existentes adaptados; resumen de Mis eventos; barra de DetalleEvento (comprar/agotado); separadores del chat |
| E2E | los flujos existentes y el de la spec 20 siguen verdes |
| Manual | Expo Go claro/oscuro en cada pantalla |

## Fuera de alcance
Cambios de flujo o de reglas; animaciones de transición entre pantallas.

## Notas de IA
La IA armó las maquetas a partir de las pantallas existentes; el usuario las aprobó. El resumen de Mis eventos pide un dato nuevo al back porque sumar solo la página visible daría un total incorrecto.
