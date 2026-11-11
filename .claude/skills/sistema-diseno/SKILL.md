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
| `Pantalla` | `children, scroll?, refreshing?, onRefresh?, bordes?` | `SafeAreaView` con `edges={bordes}` (`["top", "bottom"]` en pantallas sin header, como Login), `keyboardShouldPersistTaps="handled"` con scroll, padding `lg`, `maxWidth: 480` centrado en web |
| `Cargando` | — | `ActivityIndicator` centrado |
| `ErrorCarga` | `mensaje, onReintentar` | ícono + texto + botón |
| `Aviso` | `icono, texto, color?, accion?, testID?` | base interna de `EstadoVacio` y `ErrorCarga`; no usar directo en pantallas |
| `EstadoVacio` | `icono, texto, accion?` | |
| `ChipEstado` | `estado` | color + ícono + texto desde `theme.estados` |
| `TarjetaEvento` | `evento, onPress` | `Card` con imagen, nombre, fecha formateada, lugar, "Desde $X", estrellas organizador, `testID="tarjeta-evento-<id>"` |
| `SelectorCantidad` | `valor, min, max, onCambiar` | botones − / + deshabilitados en los topes |
| `Estrellas` | `valor, onCambiar?, tamanio?` | lectura (redondea a medio punto, color `colors.estrella`) o edición (10d); `accessibilityLabel="Puntaje N de 5"` |
| `ImagenEvento` | `uri, nombre, redondeada?` | 16:9; sin `uri`, placeholder con ícono (`testID="imagen-placeholder"`) |
| `PuntajeOrganizador` | `organizador` | nombre + `Estrellas` + puntaje, o "Sin reseñas" |
| `LineaDeTiempo` | `historial` | estado + quién + fecha |
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
