# Spec 15 — Pulido de UI

- **Estado:** aprobada
- **Rama:** `fix/pulido-ui`
- **Casos de uso:** CU2 (disponibilidad en Compras del evento), CU1, CU3 (filtros de Mis compras y Explorar) (ver `planes/00-indice.md`)
- **Iteración:** It5
- **Depende de:** skill `sistema-diseno` (revisión visual), specs 10, 10c y 11

## Contexto

Revisión visual de It5 con `sistema-diseno`: capturas de las 14 pantallas en modo claro y oscuro sobre Expo Web (spec temporal de Cypress que fuerza `prefers-color-scheme`) más análisis estático (colores sueltos, tipografía, botones primarios, etiquetas de accesibilidad). Sin colores rotos en modo oscuro ni estilos fuera del tema. Quedan tres hallazgos, aprobados por el usuario.

## Historias

- Como organizador, quiero leer sin superposiciones las ventas y lo recaudado de cada evento.
- Como usuario, quiero distinguir de un vistazo qué filtro está activo, en modo claro y oscuro.
- Como usuario de lector de pantalla, quiero que la tarjeta de mis eventos anuncie su contenido.

## Reglas de negocio

No agrega reglas.

## Contrato de API

Sin cambios.

## Pantallas

| Hallazgo | Componente | Cambio |
|---|---|---|
| 1 (alta, web) | `components/BarraDeVentas` (Mis eventos, Compras del evento) | En web, `ProgressBar` de Paper 5.15.4 envuelve la barra en un `View` con `height: '100%'`: ocupa todo el alto de `BarraDeVentas` y el texto "N de M vendidas" se desborda sobre "Recaudado $…". Se envuelve el `ProgressBar` en una pista de alto fijo (`espaciado.xs`, el alto de la barra), `testID="barra-ventas-pista"`. |
| 2 (media) | `components/ChipsFiltro` (Explorar, Mis compras, Compras del evento) | Elegido y no elegidos tienen casi el mismo relleno (solo cambia el ✓); en oscuro toda la fila queda ladrillo. Patrón MD3 de chip de filtro: no elegidos `mode="outlined"`, elegido `mode="flat"` con relleno. |
| 3 (baja, a11y) | `pantallas/mis-eventos/TarjetaEventoPropio` | Tarjeta tocable sin `accessibilityLabel` (`TarjetaEvento` y `TarjetaCompra` lo tienen). Etiqueta: "<nombre>, <fecha>, <lugar>, N de M vendidas, recaudado $X" (+ ", finalizado" si ya ocurrió). |

## Criterios de aceptación

```gherkin
Escenario: las ventas no se superponen con lo recaudado
  Dado que Fénix abre Mis eventos en la web
  Entonces "N de M vendidas" queda debajo de la barra y arriba de "Recaudado $…", sin superponerse
  Y en Compras del evento el texto queda pegado a su barra

Escenario: el filtro activo se distingue
  Dado una fila de chips de filtro
  Entonces los no elegidos se ven delineados y sin relleno
  Y el elegido se ve con relleno y ✓

Escenario: la tarjeta de un evento propio se anuncia
  Dado que Fénix tiene "Los Piojos en River" con 60 de 150 vendidas y $ 2.700.000 recaudados
  Entonces la tarjeta tiene la etiqueta "Los Piojos en River, <fecha>, Estadio River Plate, 60 de 150 vendidas, recaudado $ 2.700.000"
```

## Plan de tests

| Nivel | Caso |
|---|---|
| Front (RNTL) | `BarraDeVentas`: la pista tiene alto fijo `espaciado.xs`; `ChipsFiltro`: no elegidos delineados y elegido con relleno; `MisEventos`: etiqueta accesible de la tarjeta (con y sin "finalizado") |
| Visual (temporal, no se commitea) | Capturas claro/oscuro antes y después de Mis eventos, Compras del evento, Explorar y Mis compras |
| E2E | `npm run e2e` 3/3 como regresión (los flujos usan los chips y Mis eventos) |

## Fuera de alcance

- Anillo de foco del navegador en web (se conserva por accesibilidad de teclado).
- Placeholder mientras cargan las imágenes remotas.
- Rediseño de colores o del tema.

## Notas de IA

- La IA armó una spec temporal de Cypress que fuerza el esquema de color y sacó 28 capturas; dos falsos positivos (etiquetas de Nuevo evento e imágenes) resultaron capturas tomadas antes de terminar de cargar y se descartaron midiendo el DOM y repitiendo con más espera.
- La causa del hallazgo 1 se encontró leyendo el código de `ProgressBar` en `node_modules` (`webContainer: { height: '100%' }`), después de medir en el DOM que el contenedor tenía menos alto que su contenido.
