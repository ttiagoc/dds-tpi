# Checklist de pantalla (mobile)

## Estructura

- [ ] Ruta en `src/app/` fina; lógica y UI en `src/pantallas/<nombre>/` o componentes.
- [ ] Llamadas al back solo vía `src/api/<recurso>Api.js`.
- [ ] Usuario desde `useAuth()`; acciones según `acciones` del back.
- [ ] Reutiliza `src/components/` antes de crear algo nuevo.

## Feedback

- [ ] Cargando, error (con reintentar), vacío, enviando, éxito.
- [ ] Acciones destructivas piden confirmación.
- [ ] Sin `alert()`.

## Mobile

- [ ] Probado en Expo Go en el celular.
- [ ] Probado en web a 375 px (si la pantalla está en un flujo e2e).
- [ ] Respeta safe area y teclado (formularios no tapados por el teclado).
- [ ] Listas con `FlatList` y pull-to-refresh.

## Accesibilidad

- [ ] Título de pantalla con `Text variant="headlineSmall"` (o header del Stack).
- [ ] `accessibilityLabel` en botones de solo ícono e imágenes.
- [ ] Estado no comunicado solo por color.
- [ ] Áreas táctiles ≥ 44 px.

## Consistencia

- [ ] Solo componentes Paper; colores y espaciado del tema, sin hex.
- [ ] Textos en castellano rioplatense con el mismo tono que el resto.

## Calidad

- [ ] `testID` en lo interactivo y lo que verifica Cypress.
- [ ] Test RNTL con API mockeada (datos, error, acción principal).
- [ ] `npm test` en verde.
- [ ] Sin comentarios obvios, sin `console.log`.
