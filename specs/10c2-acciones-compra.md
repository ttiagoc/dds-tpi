# Spec 10c2 — Pagar y cancelar desde el detalle de la compra

- **Estado:** implementada
- **Rama:** `feature/acciones-compra`
- **Casos de uso:** CU7, CU8 (ver `planes/00-indice.md`); pagar completa el flujo de compra de CU12 (R3)
- **Iteración:** It4
- **Depende de:** spec 06 (`POST /compras/:id/pago` y `/cancelacion`), spec 10c (DetalleCompra en lectura)

## Contexto

La spec 10c dejó DetalleCompra en modo lectura. Esta spec agrega las dos acciones del comprador sobre su compra: pagar una compra pendiente y cancelarla (con reembolso si estaba confirmada, CU7), respetando que no se puede cancelar una compra utilizada ni de un evento ya ocurrido (CU8). Las reglas las aplica el back; el front solo muestra los botones que habilita `compra.acciones`.

## Historias

- Como comprador, quiero pagar una compra pendiente para confirmarla.
- Como comprador, quiero cancelar una compra para liberar las entradas y, si ya la había pagado, obtener el reembolso (CU7).
- Como comprador, no quiero ver la opción de cancelar cuando la compra ya fue utilizada o el evento ya ocurrió (CU8).

## Reglas de negocio

Sin reglas nuevas. Aplican R2, R2b y R3 de `planes/02-dominio.md`, todas resueltas en el back:

- `acciones.puedePagar` es `true` solo para el comprador dueño, con la compra PENDIENTE y el evento sin ocurrir (R3).
- `acciones.puedeCancelar` es `true` solo para el comprador dueño, con la compra PENDIENTE o CONFIRMADA y el evento sin ocurrir (R2).
- Cancelar desde CONFIRMADA termina en REEMBOLSADA; desde PENDIENTE queda CANCELADA (R2b).

Reglas de la pantalla:

- **RA1 Botones.** Debajo del resumen, antes del historial: "Pagar" (`compra-pagar`, `contained`) si `acciones.puedePagar`, y "Cancelar compra" (`compra-cancelar`, `outlined`, color de error) si `acciones.puedeCancelar`. El front no reimplementa las reglas: sin `acciones` o con todo en `false` no se muestra ningún botón (el organizador nunca ve estos dos).
- **RA2 Pagar.** Sin diálogo. Al tocar: el botón muestra loading y los dos botones quedan deshabilitados; `POST /compras/:id/pago`; con éxito la pantalla se actualiza con el `CompraDetalle` de la respuesta (estado, días restantes, historial y botones) y aparece el Snackbar "Pago confirmado".
- **RA3 Cancelar.** Tocar "Cancelar compra" abre un `Dialog` "¿Cancelar la compra?":
  - PENDIENTE: "Se liberan las N entradas.";
  - CONFIRMADA: "Se liberan las N entradas y se te reembolsan $total." (con `formatearPrecio`; "la entrada" si N = 1);
  - botones "Volver" (cierra sin llamar al back) y "Cancelar compra" (`confirmar-cancelacion`).
  Al confirmar, el diálogo se cierra, el botón muestra loading, `POST /compras/:id/cancelacion` y la pantalla se actualiza con la respuesta. Snackbar "Compra cancelada" si quedó CANCELADA o "Compra cancelada y reembolsada" si quedó REEMBOLSADA.
- **RA4 Doble toque.** Mientras una acción está en curso, otro toque (del mismo botón o del otro) no hace un segundo pedido (`useRef`, como `BotonFavorito` y `useConfirmar`).
- **RA5 Errores.** Cualquier error de la acción se muestra con el texto de `mensajeDeError` en un `HelperText` de error bajo los botones (`compra-accion-error`); se limpia al empezar otra acción. Si es 422 (texto exacto del back), además se vuelve a pedir `GET /compras/:id` para que estado y botones reflejen la compra real, sin perder el mensaje ni mostrar la pantalla de carga.
- **RA6 Aviso.** El Snackbar (`compra-aviso`) dura lo estándar de Paper y se puede cerrar. Mis compras se entera del cambio por el refresco al recuperar el foco (RM4 de 10c).

## Contrato de API

Sin cambios. Usa tal cual `planes/03`:

| Función (`src/api/comprasApi.js`) | Endpoint |
| --- | --- |
| `pagarCompra(id)` | `POST /compras/:id/pago` → `CompraDetalle` |
| `cancelarCompra(id)` | `POST /compras/:id/cancelacion` → `CompraDetalle` (CANCELADA o REEMBOLSADA) |

Mensajes 422 del back que se pueden mostrar: "No podés pagar una compra de un evento que ya ocurrió", "No podés cancelar una compra utilizada", "La compra ya está cancelada", "No podés cancelar una compra de un evento que ya ocurrió", "No se puede pasar de <ESTADO> a <ESTADO>". También "No existe la compra", "No tenés permiso para realizar esta acción" y "No pudimos conectar con el servidor".

## Pantallas

- **DetalleCompra** (`compras/[id]`, `src/pantallas/detalle-compra/`): suma `compra-pagar`, `compra-cancelar`, `confirmar-cancelacion`, `compra-accion-error`, `compra-aviso`. La lógica de las acciones va en un hook de la pantalla (`useAccionesCompra`), no en el JSX.

## Criterios de aceptación

```gherkin
Escenario: pagar una compra pendiente
  Dado que estoy logueada como Ana y abro una compra PENDIENTE de un evento futuro
  Cuando toco "Pagar"
  Entonces se llama a POST /compras/:id/pago una sola vez
  Y veo el estado Confirmada, "Faltan N días", el paso nuevo en el historial y el aviso "Pago confirmado"
  Y ya no veo "Pagar" pero sí "Cancelar compra"

Escenario: cancelar una compra confirmada
  Dado que abro una compra CONFIRMADA de un evento futuro
  Cuando toco "Cancelar compra"
  Entonces veo "¿Cancelar la compra?" con el monto a reembolsar
  Cuando toco "Cancelar compra" en el diálogo
  Entonces veo el estado Reembolsada, el aviso "Compra cancelada y reembolsada" y ningún botón

Escenario: cancelar una compra pendiente
  Dado que abro una compra PENDIENTE
  Cuando la cancelo y confirmo
  Entonces veo el estado Cancelada y el aviso "Compra cancelada"

Escenario: volver del diálogo
  Cuando toco "Cancelar compra" y después "Volver"
  Entonces no se llama al back y la compra sigue igual

Escenario: sin acciones disponibles (CU8)
  Dado que abro una compra UTILIZADA, CANCELADA, REEMBOLSADA o de un evento que ya ocurrió
  Entonces no veo "Pagar" ni "Cancelar compra"

Escenario: el back rechaza la acción
  Dado que la compra cambió desde que la abrí
  Cuando toco "Pagar" y el back responde 422 "No podés pagar una compra de un evento que ya ocurrió"
  Entonces veo ese texto bajo los botones y la compra se vuelve a pedir

Escenario: doble toque
  Cuando toco "Pagar" dos veces seguidas
  Entonces se hace un solo pedido
```

## Plan de tests

| Nivel | Caso |
| --- | --- |
| Front unit | `comprasApi.pagarCompra` y `cancelarCompra` (método, URL, devuelve `data`) |
| Front pantallas (RNTL) | DetalleCompra: botones según `acciones` (ninguno, solo pagar, solo cancelar, ambos); pagar con loading, actualización y Snackbar; doble toque; cancelar CONFIRMADA → REEMBOLSADA y PENDIENTE → CANCELADA con su Snackbar; texto del diálogo según estado; "Volver" no llama; 422 muestra el texto y recarga; error de red muestra el texto sin recargar; el error se limpia al reintentar |
| Back | sin cambios (cubierto por la spec 06) |
| Manual | Expo Go y web: pagar y cancelar, volver a Mis compras y ver el estado nuevo |
| E2E | spec temporal de Cypress contra el back real al cerrar la rama: pagar una pendiente y cancelar una confirmada que termina REEMBOLSADA (se borra) |

## Fuera de alcance

- Reseñar (10d), Marcar utilizada (11) y Chat (12): cada uno con su spec.
- Actualización en vivo del estado por socket (`compra:estado`), que va con el chat (12).
- Vencimiento de compras pendientes (pregunta abierta de `planes/02`, respondida "No").

## Notas de IA

- Decidido por el usuario antes de la spec: botones desde `compra.acciones`; Pagar sin diálogo con Snackbar "Pago confirmado"; Cancelar con Dialog (`confirmar-cancelacion`); testIDs de `planes/04`; 422 con el texto exacto del back.
- Preguntas a la IA, el usuario eligió las opciones recomendadas: 422 → mensaje + recarga de la compra; error en `HelperText` bajo los botones (`compra-accion-error`); texto del diálogo según estado (con el monto a reembolsar si está confirmada); Snackbar también al cancelar, según el resultado.
- La IA agregó sin preguntar (revisable): ubicación de los botones (después del resumen, antes del historial), estilos `contained` / `outlined` con color de error, ambos deshabilitados durante una acción, testID `compra-aviso`, hook `useAccionesCompra`, nombres `pagarCompra` / `cancelarCompra`.
- Cambios en la implementación: `useCargar` expone `reemplazar(datos)` para mostrar el `CompraDetalle` de la respuesta sin volver a pedirlo; texto "Se libera la entrada." cuando N = 1.
- Revisión de calidad (3 hallazgos aplicados): `hooks/useEnvio({ recargar })` concentra el envío protegido (guard con `useRef`, error con `mensajeDeError`, recarga en 422) y lo usan `useConfirmar` y `useAccionesCompra`; se borró un `useTheme()` sin uso en DetalleCompra; los handlers async se envuelven todos con `() => { f(); }`.
- Única derivación de R2b en el front: el texto del diálogo menciona el reembolso si la compra está CONFIRMADA (el back no expone ese dato). Aceptado en la revisión.
- Verificación: spec temporal de Cypress contra el back real (pagar una pendiente; cancelar una confirmada que termina REEMBOLSADA), 2/2, borrada al terminar.
