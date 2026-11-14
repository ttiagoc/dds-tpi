---
name: sistema-diseno
description: Usar al definir o cambiar el tema visual de la app Expo de AI Ticket It (React Native Paper MD3), al crear un componente compartido nuevo, al elegir colores/tipografía/espaciado, o al hacer una revisión visual de pantallas. Mantiene la UI consistente y evita estilos sueltos.
---

# Sistema de diseño

La app tiene que verse como un producto, no como una suma de pantallas. Todo lo visual sale de `frontend/src/tema/` y `frontend/src/components/`.

## Identidad

- **Personalidad**: entradas para eventos en vivo → enérgica pero clara. Un color primario fuerte (violeta/magenta "escenario"), secundario cálido, fondos neutros. Modo claro y oscuro.
- **Jerarquía**: lo importante de cada tarjeta es nombre del evento, fecha y precio/estado. Todo lo demás, secundario (`bodySmall`, `onSurfaceVariant`).
- **Imágenes**: los eventos muestran imagen (`multimedia[0]`) con proporción 16:9; si no hay, placeholder con ícono de la categoría.

## Tokens (`src/tema/tema.js`)

```js
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

const estadosClaro = {
  PENDIENTE: { fondo: "...", texto: "...", icono: "clock-outline" },
  CONFIRMADA: { fondo: "...", texto: "...", icono: "check-circle-outline" },
  UTILIZADA: { fondo: "...", texto: "...", icono: "ticket-confirmation-outline" },
  CANCELADA: { fondo: "...", texto: "...", icono: "close-circle-outline" },
  REEMBOLSADA: { fondo: "...", texto: "...", icono: "cash-refund" },
};

export const temaClaro = {
  ...MD3LightTheme,
  colors: { ...MD3LightTheme.colors, primary: "...", secondary: "..." },
  estados: estadosClaro,
};
```

- Los **únicos** hex del proyecto viven en `tema.js`. Generar la paleta MD3 a partir del color semilla (Material Theme Builder) y pegarla.
- Contraste mínimo AA (4.5:1) texto/fondo en ambos modos para los chips de estado.
- `src/tema/espaciado.js`: `{ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }`. Radios: `{ sm: 8, md: 12, lg: 16 }`.
- Tipografía: variantes MD3 de Paper; no definir `fontSize` a mano.

## Catálogo de componentes compartidos

| Componente | Props | Notas |
|---|---|---|
| `Pantalla` | `children, scroll?, bordes?, testID?` | `SafeAreaView` con `edges={bordes}` (`["top", "bottom"]` en pantallas sin header, como Login), `keyboardShouldPersistTaps="handled"` con scroll, padding `lg`, `maxWidth: 480` centrado en web |
| `Cargando` | — | `ActivityIndicator` centrado |
| `ErrorCarga` | `mensaje, onReintentar` | ícono + texto + botón |
| `Aviso` | `icono, texto, color?, accion?, testID?` | base interna de `EstadoVacio` y `ErrorCarga`; no usar directo en pantallas |
| `EstadoVacio` | `icono, texto, accion?` | |
| `ConCarga` | `carga, iconoInexistente, testIDInexistente, children(datos)` | estados de un `useCargar`: `Cargando` solo si no hay datos previos (una recarga conserva la pantalla), 403/404 → `EstadoVacio` con "Volver", otro error → `ErrorCarga` |
| `ConRecursoDeRuta` | `obtener, iconoInexistente, testIDInexistente, children(datos, carga)` | `ConCarga` del recurso cuyo id viene en la ruta; `obtener` tiene que ser estable (función de `src/api/`) |
| `ConCompra` | `children(compra, carga)` | `ConRecursoDeRuta` con `obtenerCompra` (`testIDInexistente="compra-inexistente"`); lo usan DetalleCompra, Reseñar y Chat |
| `AvisoConVolver` | `icono, texto, testID` | `Aviso` con acción "Volver" (`testID="volver"`); cuando la pantalla no aplica al recurso (Comprar sin entradas, Reseñar no disponible) |
| `ConEvento` | `children(evento, carga)` | `ConRecursoDeRuta` con `obtenerEvento`; lo usan DetalleEvento y Comprar |
| `ListaPaginada` | `lista, renderItem, encabezado, vacio, testID` | `FlatList` sobre `useListaPaginada(paginaDe(listar, campo), criterio)`: pull-to-refresh, `Cargando`/`ErrorCarga`/`vacio` y `PieDeLista` ("Cargar más", errores al pie) |
| `ChipsFiltro` | `opciones: [{ valor, etiqueta }], seleccionada, onElegir, prefijoTestID` | chip "Todas" + selección única; tocar el elegido lo quita; no elegidos `outlined`, elegido `flat` con ✓ (filtro MD3); testIDs `<prefijo>-todas` y `<prefijo>-<valor>` |
| `FiltroEstadoCompra` | `estado, onElegir` | `ChipsFiltro` con los estados de compra (`ESTADOS_COMPRA`) |
| `ListaDeCompras` | `pedir, criterio, testID, vacio: { textoFiltrada, sinFiltro, testID }, conComprador?, encabezado?({ extra, filtro })` | `ListaPaginada` de `TarjetaCompra` con `FiltroEstadoCompra`; vacío filtrado con "Ver todas"; recarga al volver; la usan MisCompras y ComprasDelEvento |
| `BarraDeVentas` | `vendidas, cupo` | `ProgressBar` + "N de M vendidas"; la barra va en una pista de alto fijo (`espaciado.xs`, `testID="barra-ventas-pista"`) porque en web el `ProgressBar` de Paper toma `height: '100%'` del contenedor y el texto se superpone con lo que sigue |
| `EncabezadoEvento` | `evento` | nombre (`headlineSmall`) + `FechaYLugar`; encabeza Comprar, Reseñar y Chat |
| `ErrorEnLinea` | `mensaje, onReintentar, testID?` | `HelperText` de error + "Reintentar" (texto) dentro de una sección, sin reemplazar la pantalla (categorías de Nuevo evento, reseñas del organizador); para la pantalla entera, `ErrorCarga` |
| `Contador` | `largo, maximo, testID` | `HelperText` "N/M" alineado a la derecha; Reseñar y Chat |
| `FechaYLugar` | `fecha, lugar, variant?, atenuado?` | "dom 20 dic · 20:00 · Lugar" |
| `TarjetaCompra` | `compra, onPress` | evento, tipo × cantidad · total, `ChipEstado`, días restantes; `testID="compra-<id>"` |
| `ChipEstado` | `estado` | color + ícono + texto desde `theme.estados` |
| `TarjetaEvento` | `evento, onPress` | `Card` con imagen, nombre, fecha formateada, lugar, "Desde $X", estrellas organizador, `testID="tarjeta-evento-<id>"` |
| `SelectorCantidad` | `valor, min?, max, onCambiar, testIDPrefijo?` | `IconButton` − / + deshabilitados en los topes, labels "Restar uno" / "Sumar uno"; testIDs `<prefijo>-menos`, `<prefijo>-valor`, `<prefijo>-mas` (prefijo `cantidad`) |
| `Estrellas` | `valor, onCambiar?, tamanio?` | lectura (redondea a medio punto, color `colors.estrella`) o edición (10d); `accessibilityLabel="Puntaje N de 5"` |
| `ImagenEvento` | `uri, nombre, redondeada?` | 16:9; sin `uri`, placeholder con ícono (`testID="imagen-placeholder"`) |
| `PuntajeOrganizador` | `organizador` | nombre + `Estrellas` + puntaje, o "Sin reseñas" |
| `LineaDeTiempo` | `historial` | un paso por cambio con ícono y color del estado (`useEstadoCompra`), quién y fecha; `testID="historial-<n>"` |
| `Precio` | `monto` | `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })` |

Formateo centralizado en `src/utils/formato.js` (`formatearFecha`, `formatearDia`, `formatearPrecio`, `formatearPuntaje`) (`es-AR`, ej. "sáb 20 dic · 20:00").

## Cuándo crear un componente nuevo

1. ¿Lo cubre un componente Paper directo? → usar Paper.
2. ¿Ya hay uno en el catálogo que con una prop extra sirve? → extenderlo.
3. Se usa en ≥ 2 pantallas o encapsula formato de dominio (estado, precio, fecha) → componente compartido, agregarlo a esta tabla.
4. Si no → componente local de la pantalla.

## Revisión visual (al cerrar cada pantalla o en It5)

- [ ] Espaciado consistente (solo tokens), alineaciones a grilla de 4.
- [ ] Un solo botón primario (`mode="contained"`) por vista; secundarios `outlined`/`text`.
- [ ] Jerarquía tipográfica clara; nada de texto gris sobre gris.
- [ ] Modo oscuro sin colores rotos.
- [ ] Estados vacíos y de error con el mismo estilo en todas las pantallas.
- [ ] Nada de "AI slop": sin gradientes random, emojis decorativos ni sombras exageradas.

Skill externa complementaria: `building-native-ui` de `expo/skills` (si está instalada) para patrones nativos de Expo.
