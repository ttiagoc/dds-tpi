# Spec 19 — Identidad visual "Minimal cálido"

- **Estado:** aprobada
- **Rama:** `feature/identidad-visual`
- **Casos de uso:** transversal (todas las pantallas)
- **Iteración:** It5b (rediseño)
- **Depende de:** spec 09 (tema), spec 15 (pulido UI), ADR-002 (React Native Paper)
- **Maquetas:** https://claude.ai/artifact/Hd8WR9Hc3rjSkCYGqdRw8e

## Contexto
La app usa el tema MD3 casi por defecto (violeta `#8E2DA8`, fuente del sistema, tarjetas con sombra): funciona pero se ve genérica. Se define una identidad propia, simple y cálida, validada con maquetas antes de codear. Esta spec cambia solo la base (tokens, fuente y componentes compartidos) para que todas las pantallas cambien juntas; los ajustes de cada pantalla van en la spec 22.

## Historias
- Como usuario, quiero una app con identidad propia, fácil de leer y con una sola acción destacada por pantalla.

## Reglas de negocio
Sin reglas de dominio. Reglas de diseño (pasan a `frontend/.claude/skills/sistema-diseno/SKILL.md`):

- **RD1 Paleta.** Neutros cálidos y un único acento:

  | Token | Claro | Oscuro |
  |---|---|---|
  | `background` | `#FAFAF7` | `#141311` |
  | `surface` | `#FFFFFF` | `#1E1C1A` |
  | `onSurface` (tinta) | `#1C1B19` | `#F2EFEA` |
  | `onSurfaceVariant` (apagado) | `#6B6862` | `#A39F97` |
  | `outlineVariant` (borde) | `#E7E4DE` | `#2E2B28` |
  | `primary` (acento) | `#BF4316` | `#FF8A55` |
  | `onPrimary` | `#FFFFFF` | `#141311` |
  | `primaryContainer` / `onPrimaryContainer` | `#FBE6DC` / `#8A2E0C` | `#5A230C` / `#FFDCCB` |

  El acento se reserva para la acción principal, la pestaña activa y los no leídos. Todo texto cumple contraste 4.5:1.
- **RD2 Estados de compra.** Píldora pastel con punto de color (`ChipEstado`): Pendiente ámbar, Confirmada verde, Utilizada azul, Cancelada rojo, Reembolsada violeta; los tonos de `theme.estados` se ajustan a la paleta cálida y mantienen contraste en los dos modos.
- **RD3 Tipografía.** Manrope (`@expo-google-fonts/manrope`, pesos 500, 600, 700 y 800) en todas las variantes MD3 con `configureFonts`: títulos 800 con tracking negativo, etiquetas 600-700, texto 500. La app no se muestra hasta que cargan las fuentes (`expo-splash-screen`); si fallan, sigue con la fuente del sistema.
- **RD4 Formas.** Tarjetas planas: fondo `surface`, borde 1 px `outlineVariant`, radio 16, sin sombra. Botones e inputs de búsqueda en píldora (`radios.pill`), alto mínimo 48. Chips de filtro: el activo relleno con tinta, el resto con borde.
- **RD5 Pestañas.** Barra plana con borde superior, ícono + etiqueta; solo la activa usa el acento. Soporta `tabBarBadge` (lo usa la spec 20).
- **RD6 Fechas de evento.** `TarjetaEvento` muestra la fecha en un bloque (día de la semana, número y mes) a la izquierda del nombre.
- **RD7 Entradas.** `TarjetaCompra` tiene forma de entrada: datos arriba, línea punteada con troqueles a los costados, y abajo el estado y los días restantes. La pestaña del comprador "Mis compras" pasa a llamarse "Entradas" (la ruta y el testID `tab-mis-compras` no cambian).

## Contrato de API
Sin cambios.

## Pantallas
Componentes que se rehacen: `tema/tema.js`, `tema/espaciado.js` (`radios.pill`), `navegacion/Pestanias.jsx`, `ChipEstado`, `ChipsFiltro`, `TarjetaEvento`, `TarjetaCompra`, `EstadoVacio`, `Pantalla`, `Logo`. Raíz: `app/_layout.jsx` carga las fuentes. testIDs sin cambios.

## Criterios de aceptación
```gherkin
Escenario: tema claro y oscuro
  Dado el modo del sistema en claro u oscuro
  Cuando abro cualquier pantalla
  Entonces usa los tokens de RD1 de ese modo y la fuente Manrope

Escenario: fuentes antes de mostrar la app
  Cuando la app arranca
  Entonces el splash se mantiene hasta que cargan las fuentes o fallan

Escenario: tarjeta de entrada
  Dado una compra CONFIRMADA a 23 días
  Cuando veo Entradas
  Entonces su tarjeta muestra la píldora "Confirmada" y "Faltan 23 días" debajo de la línea punteada
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front (RNTL) | tema exporta tokens de RD1 en claro y oscuro; `ChipEstado` con texto y punto; `TarjetaEvento` muestra el bloque de fecha; `TarjetaCompra` sigue mostrando estado y días; suite completa sin cambios de testIDs |
| E2E | los 3 flujos siguen verdes |
| Manual | Expo Go claro/oscuro en Explorar, Entradas, Detalle, Chat |

## Fuera de alcance
Cambios de estructura de cada pantalla (spec 22), ícono de la app y splash nuevos.

## Notas de IA
La IA relevó dos proyectos de referencia (ambos web, verde `#1f7a5a`) y propuso tres direcciones; el usuario eligió "Minimal cálido" y validó maquetas. La IA oscureció el acento de `#D9531E` a `#BF4316` porque el texto blanco no llegaba a 4.5:1.
