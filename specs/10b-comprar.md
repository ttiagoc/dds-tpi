# Spec 10b — Comprar entradas

- **Estado:** implementada
- **Rama:** `feature/comprar`
- **Casos de uso:** CU12 (ver `planes/00-indice.md`)
- **Iteración:** It4
- **Depende de:** spec 06 (`POST /compras`), spec 10 (detalle del evento, ruta provisoria `eventos/[id]/comprar`)

## Contexto

Desde el detalle del evento, el botón Comprar hoy lleva a una pantalla "Próximamente". Esta spec arma la compra: elegir un tipo de entrada y una cantidad sin superar lo disponible, ver el total y confirmar. La compra nace PENDIENTE; pagarla, cancelarla y verla en detalle es la spec 10c.

## Historias

- Como comprador, quiero comprar entradas de un evento eligiendo uno de los tipos disponibles y la cantidad, sin superar el cupo (CU12).

## Reglas

Reglas de negocio existentes, sin cambios: **R1** (solo COMPRADOR, evento no ocurrido, tipo existente, `hayCupoPara`) y **C2** de la spec 06 (cantidad entera de 1 a 10). El back es quien decide; el front solo evita pedidos que ya sabe inválidos.

Reglas de la pantalla:

- **RC1 Datos.** La pantalla vuelve a pedir `GET /eventos/:id` (con `useCargar`) para tener los `disponibles` al momento. Arriba muestra nombre, fecha y lugar del evento.
- **RC2 Tipos.** Un `RadioButton.Item` por tipo (`tipo-<id>`) con nombre, precio y "Quedan N"; con `disponibles: 0` muestra "Agotado" y queda deshabilitado. Al abrir queda elegido el **primer tipo con disponibles** y cantidad 1.
- **RC3 Cantidad.** Componente compartido `SelectorCantidad` (− / n / +): mínimo 1, máximo `min(disponibles del tipo elegido, 10)`. El botón que llega al límite se deshabilita. Al cambiar de tipo, la cantidad se ajusta al tope del nuevo tipo si lo supera.
- **RC4 Total.** "Total: $X" = `precio × cantidad` con `formatearPrecio`, siempre visible arriba de Confirmar. Sin diálogo de confirmación: la compra nace PENDIENTE y se puede cancelar.
- **RC5 Confirmar.** `comprar-confirmar` (`contained`) llama `POST /compras` con `{ eventoId, tipoEntradaId, cantidad }`. Mientras viaja queda `loading` y deshabilitado, y un segundo toque no crea otra compra.
- **RC6 Éxito.** `router.replace("/compras/<id>")` con el `id` de la compra creada; volver atrás lleva al detalle del evento. Hasta la spec 10c, `compras/[id]` muestra "Próximamente".
- **RC7 Error 422** (sin cupo o evento ocurrido). Se muestra el mensaje del back (`comprar-error`), se vuelve a pedir el evento y, con los disponibles nuevos, se conserva el tipo elegido ajustando la cantidad al nuevo tope. Si ese tipo quedó agotado, se elige el primero con disponibles; si no queda ninguno, aplica RC9.
- **RC8 Otros errores** (400, 404, red). Se muestra el mensaje (`mensajeDeError`) y se conserva lo elegido, sin recargar.
- **RC9 Estados.** Cargando con `Cargando`; 404 → `EstadoVacio` "No existe el evento" con "Volver"; otro error → `ErrorCarga` con Reintentar; todos los tipos agotados → `EstadoVacio` "No quedan entradas para este evento" con "Volver".
- **RC10 Navegación.** `eventos/[id]/comprar` pasa a estar protegida para `rol === "COMPRADOR"` (cierra la nota pendiente de la spec 10: un organizador ya no entra por deep link). `compras/[id]` se agrega protegida para cualquier usuario logueado (la usan los dos roles en 10c y 11), con header y título "Compra".

## Contrato de API

Sin cambios. Usa tal cual `planes/03`:

| Función (`src/api/`)                                                          | Endpoint                              |
| ----------------------------------------------------------------------------- | ------------------------------------- |
| `obtenerEvento(id)` (ya existe)                                               | `GET /eventos/:id`                    |
| `crearCompra({ eventoId, tipoEntradaId, cantidad })` (nueva, `comprasApi.js`) | `POST /compras` → 201 `CompraDetalle` |

Mensajes del back que se pueden mostrar: "No hay cupo suficiente para <tipo>", "No podés comprar entradas de un evento que ya ocurrió", "No existe el evento", "No existe el tipo de entrada <id> en este evento", y "No pudimos conectar con el servidor" (de `mensajeDeError`).

## Pantallas

- **Comprar** (`eventos/[id]/comprar`, en `src/pantallas/comprar/`): `tipo-<id>`, `cantidad-menos`, `cantidad-mas`, `cantidad-valor`, `comprar-total`, `comprar-confirmar`, `comprar-error`.
- **Compra provisoria** (`compras/[id]`): reutiliza `Proximamente`.

Componente compartido nuevo (`src/components/`, se agrega al catálogo de `sistema-diseno`):

- `SelectorCantidad({ valor, min = 1, max, onCambiar, testIDPrefijo = "cantidad" })` — `IconButton` − y + con `accessibilityLabel` "Restar uno" / "Sumar uno", valor en el medio (`<prefijo>-valor`). Lo puede reusar CrearEvento (11) si hace falta.

## Criterios de aceptación

```gherkin
Escenario: comprar dos entradas
  Dado que estoy logueada como Ana en el detalle de "Los Piojos en River"
  Cuando toco Comprar
  Entonces veo los tipos de entrada con el primero disponible elegido y cantidad 1
  Cuando sumo una entrada
  Entonces el total es el doble del precio del tipo
  Cuando toco Confirmar
  Entonces se hace POST /compras con cantidad 2
  Y paso a la compra creada, en reemplazo de la pantalla Comprar

Escenario: tipos agotados
  Dado un evento con "Platea" sin disponibles
  Entonces "Platea" muestra "Agotado" y no se puede elegir

Escenario: la cantidad respeta el tope
  Dado que elegí un tipo con 3 disponibles
  Cuando sumo hasta 3
  Entonces el botón + queda deshabilitado
  Y con un tipo de 40 disponibles el tope es 10
  Y en 1 el botón − queda deshabilitado
  Cuando cambio a un tipo con menos disponibles que la cantidad elegida
  Entonces la cantidad baja al nuevo tope

Escenario: alguien compró antes (422)
  Dado que elegí 3 VIP y quedaban 3
  Y mientras tanto otro comprador se llevó 1
  Cuando toco Confirmar
  Entonces veo "No hay cupo suficiente para VIP"
  Y la pantalla se actualiza con "Quedan 2" y la cantidad en 2

Escenario: falla la red al confirmar
  Cuando toco Confirmar y no hay conexión
  Entonces veo "No pudimos conectar con el servidor"
  Y conservo el tipo y la cantidad elegidos

Escenario: doble toque
  Cuando toco Confirmar dos veces seguidas
  Entonces se crea una sola compra

Escenario: no hay nada para comprar
  Dado que todos los tipos del evento están agotados, o el evento no existe
  Entonces veo "No quedan entradas para este evento" o "No existe el evento" con "Volver"

Escenario: un organizador no puede comprar
  Dado que estoy logueado como Fénix
  Cuando abro eventos/1/comprar por deep link
  Entonces no veo la pantalla Comprar
```

## Plan de tests

| Nivel                    | Caso                                                                                                                                                                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Front unit               | `comprasApi.crearCompra` hace `POST /compras` con el body y devuelve `data`                                                                                                                                                                                                                                 |
| Front componentes (RNTL) | `SelectorCantidad`: suma y resta, deshabilita en `min` y `max`, labels accesibles                                                                                                                                                                                                                           |
| Front pantallas (RNTL)   | Comprar: preselección del primer disponible, agotado deshabilitado, tope `min(disponibles, 10)`, ajuste al cambiar de tipo, total, POST + `router.replace`, `loading` y doble toque, 422 con mensaje + recarga + ajuste, error de red conserva, todo agotado, 404 con Volver, error de carga con Reintentar |
| Navegación               | `__tests__/navegacion.test.jsx`: el organizador no llega a Comprar por deep link; `compras/[id]` abre para el comprador                                                                                                                                                                                     |
| Back                     | sin cambios (cubierto por la spec 06)                                                                                                                                                                                                                                                                       |
| Manual                   | Expo Go y web: comprar, tope de cantidad, 422 forzado comprando el cupo desde otra sesión                                                                                                                                                                                                                   |
| E2E                      | spec temporal de Cypress contra el back real al cerrar la rama (se borra); el flujo definitivo "comprar una entrada" va en `chore/e2e-cypress` (It5)                                                                                                                                                        |

## Fuera de alcance

- DetalleCompra, pagar y cancelar (10c); Mis compras (10c).
- Comprar varios tipos en una misma compra (el contrato es un tipo por compra).
- Reserva temporal del cupo mientras el usuario elige.
- Diálogo de confirmación antes de comprar.

## Notas de IA

- El usuario eligió las cuatro opciones recomendadas por la IA: después de comprar, `router.replace` a `compras/[id]` provisoria; preselección del primer tipo con disponibles; ante un 422, mensaje + recarga del evento + ajuste de la cantidad; sin diálogo de confirmación.
- La IA agregó sin preguntar (revisable):
  - tope de cantidad `min(disponibles, 10)` en el front (el 10 viene de C2);
  - estado "No quedan entradas para este evento" si se llega con todo agotado;
  - testIDs `cantidad-valor`, `comprar-total`, `comprar-error`;
  - `compras/[id]` protegida para cualquier logueado, título "Compra".
- Cambios en la implementación:
  - `ConCarga` (estados de `useCargar`) y `ConEvento` (evento de la ruta) en `src/components/`, compartidos con DetalleEvento; `ConCarga` muestra `Cargando` solo sin datos previos, así la recarga después de un 422 conserva la elección;
  - `navegacion/volver.js` (antes local de DetalleEvento), `test-utils/mockRouter.js` para los tests que mockean `expo-router`;
  - la ruta provisoria es `compras/[id]/index` (deja lugar a `compras/[id]/chat` y `compras/[id]/resenia`);
  - el `onPress` de Confirmar envuelve la llamada async: `fireEvent.press` de RNTL 14 espera la promesa del handler (mismo patrón que `BotonFavorito`);
  - la etiqueta de cada tipo es "Nombre · $precio · Quedan N" porque `RadioButton.Item` solo acepta texto.
- Revisión de calidad (3 hallazgos aplicados): `textoDisponibilidad` en `formato.js` (lo usan el detalle y Comprar), `codigoDeError` en `cliente.js` (lo usan `useCargar`, Comprar y el interceptor del 401) y tests de `useSeleccion`.
- Verificación: spec temporal de Cypress contra el back real (compra feliz, 422 forzado por otra sesión, organizador por URL), 3/3, borrada al terminar.
