# Spec 10c — Mis compras y detalle de la compra

- **Estado:** aprobada
- **Rama:** `feature/mis-compras`
- **Casos de uso:** CU1 (ver `planes/00-indice.md`)
- **Iteración:** It4
- **Depende de:** spec 06 (`GET /compras`, `GET /compras/:id`), spec 10 (lista paginada de Explorar), spec 10b (ruta provisoria `compras/[id]`)

## Contexto

Después de comprar, la app muestra "Próximamente" en la compra creada y en el tab Mis compras. Esta spec arma las dos pantallas en modo lectura: la lista de compras del comprador, con el estado bien diferenciado y los días que faltan si está confirmada (CU1), y el detalle de una compra con su historial. Las acciones pagar y cancelar (CU7 y CU8) van en la spec 10c2 (`feature/acciones-compra`), que se apoya en este detalle.

## Historias

- Como comprador, quiero ver mis compras diferenciando con claridad el estado en que se encuentran y cuántos días faltan para el evento si están confirmadas (CU1).
- Como comprador, quiero abrir una compra y ver su detalle y por qué estados pasó.

## Reglas

Sin reglas de negocio nuevas: el front muestra lo que calcula el back (`estado`, `diasRestantes`, `historial`, orden de la lista).

- **RM1 Lista.** Tab `(comprador)/mis-compras`. `GET /compras` con `limit=10` y "Cargar más" (`cargar-mas`), pull-to-refresh y descarte de respuestas viejas, igual que Explorar (RE4 a RE6 de la spec 10). El orden es el del back: primero los eventos que no ocurrieron, por fecha asc, y después los ocurridos, por fecha desc.
- **RM2 Filtro.** Chips horizontales: "Todas" (por defecto) y uno por estado, con la etiqueta del tema (Pendiente, Confirmada, Utilizada, Cancelada, Reembolsada). Selección única; tocar el elegido o "Todas" quita el filtro. Cambiar el filtro vuelve a la página 1.
- **RM3 Tarjeta de compra.** Componente `TarjetaCompra` (`compra-<id>`): nombre del evento, fecha y lugar, "<tipo> × <cantidad> · $total", `ChipEstado` (color + ícono + texto). Si `diasRestantes` no es `null` (`dias-restantes-<id>`): "Faltan N días", "Falta 1 día" o, con 0, "Es hoy". Tocar → `compras/<id>`.
- **RM4 Refresco al volver.** Cada vez que el tab recupera el foco (por ejemplo, al volver del detalle o después de comprar), la lista se vuelve a pedir con el filtro actual (`useFocusEffect` de expo-router). La lista ya cargada se ve mientras tanto.
- **RM5 Estados de la lista.** Cargando inicial; error con `ErrorCarga` y Reintentar; vacío sin filtro: "Todavía no compraste entradas" con la acción "Explorar eventos" (va al tab Explorar); vacío con filtro: "No tenés compras en estado <Etiqueta>" con la acción "Ver todas".
- **RM6 Detalle.** `compras/[id]` (reemplaza el provisorio de la 10b), `GET /compras/:id`:
  - arriba, `ChipEstado` y, si corresponde, los días que faltan (con el mismo texto que RM3);
  - el evento con imagen, nombre, fecha y lugar; tocarlo → `eventos/<id>` (`compra-evento`);
  - el tipo, la cantidad, el precio unitario, el total y la fecha de compra;
  - `LineaDeTiempo` con el `historial` en el orden en que llega: estado (etiqueta e ícono del tema), quién y fecha y hora.
- **RM7 Estados del detalle.** Cargando; 404 "No existe la compra" y 403 "No tenés permiso para realizar esta acción" → `EstadoVacio` con "Volver"; otro error → `ErrorCarga` con Reintentar.
- **RM8 Roles.** La ruta `compras/[id]` sigue abierta a cualquier usuario logueado (el back decide con 403). En esta spec el detalle no muestra acciones para ningún rol: pagar y cancelar llegan en 10c2, reseñar en 10d, chat en 12 y marcar utilizada en 11.

## Contrato de API

Sin cambios. Usa tal cual `planes/03`:

| Función (`src/api/comprasApi.js`)           | Endpoint                                                                          |
| ------------------------------------------- | --------------------------------------------------------------------------------- |
| `listarMisCompras({ estado, page, limit })` | `GET /compras` (omite parámetros vacíos) → `{ compras, total, page, totalPages }` |
| `obtenerCompra(id)`                         | `GET /compras/:id` → `CompraDetalle`                                              |

Mensajes del back que se muestran: "No existe la compra", "No tenés permiso para realizar esta acción" y "No pudimos conectar con el servidor" (de `mensajeDeError`).

## Pantallas

- **MisCompras** (`(comprador)/mis-compras`, en `src/pantallas/mis-compras/`): `filtro-estado-todas`, `filtro-estado-<ESTADO>`, `compra-<id>`, `dias-restantes-<id>`, `cargar-mas`, `lista-compras`.
- **DetalleCompra** (`compras/[id]`, en `src/pantallas/detalle-compra/`): `compra-estado`, `dias-restantes`, `compra-evento`, `compra-total`, `linea-de-tiempo`, `historial-<n>`.

Componentes compartidos nuevos (`src/components/`, se agregan al catálogo de `sistema-diseno`):

- `TarjetaCompra({ compra, onPress })`: la puede reusar ComprasDelEvento (11).
- `LineaDeTiempo({ historial })`: un paso por cambio, con ícono y etiqueta del estado, quién y fecha y hora.

Helper nuevo: `textoDiasRestantes(dias)` en `utils/formato.js`.

## Criterios de aceptación

```gherkin
Escenario: ver mis compras
  Dado que estoy logueada como Ana, con compras en todos los estados
  Cuando abro Mis compras
  Entonces veo mis compras en el orden del back, cada una con su estado como chip con texto
  Y la compra confirmada muestra "Faltan N días"

Escenario: filtrar por estado
  Cuando toco el chip "Reembolsada"
  Entonces se pide GET /compras?estado=REEMBOLSADA desde la página 1
  Cuando toco "Todas"
  Entonces vuelvo a ver todas

Escenario: sin compras
  Dado que no tengo compras
  Entonces veo "Todavía no compraste entradas" y "Explorar eventos" me lleva a Explorar
  Y si filtro por un estado sin compras veo "No tenés compras en estado <Etiqueta>" con "Ver todas"

Escenario: cargar más
  Dado que tengo más de 10 compras
  Cuando toco "Cargar más"
  Entonces la página 2 se agrega debajo

Escenario: la lista se actualiza al volver
  Dado que estoy en Mis compras
  Cuando compro una entrada y vuelvo al tab
  Entonces la compra nueva aparece sin refrescar a mano

Escenario: ver el detalle
  Cuando toco una compra reembolsada
  Entonces veo el estado, el evento, el tipo, la cantidad, el total
  Y la línea de tiempo Pendiente → Confirmada → Cancelada → Reembolsada con quién y cuándo
  Y no veo botones de acciones

Escenario: compra ajena o inexistente
  Cuando abro compras/999 o una compra de otro comprador
  Entonces veo "No existe la compra" o "No tenés permiso para realizar esta acción" con "Volver"
```

## Plan de tests

| Nivel                    | Caso                                                                                                                                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Front unit               | `comprasApi.listarMisCompras` omite vacíos; `obtenerCompra`; `textoDiasRestantes` (0, 1, N, `null`)                                                                                                                                                                                |
| Front componentes (RNTL) | `TarjetaCompra`: datos, chip de estado, días restantes solo con valor, `onPress`. `LineaDeTiempo`: un paso por cambio, en orden, con etiqueta, quién y fecha                                                                                                                       |
| Front pantallas (RNTL)   | MisCompras: carga, filtro y "Todas", vacío sin y con filtro, cargar más, error con Reintentar, refresco al recuperar el foco, navega al detalle. DetalleCompra: datos y línea de tiempo, tocar el evento, 404 y 403 con Volver, otro error con Reintentar, sin botones de acciones |
| Navegación               | `compras/[id]` abre DetalleCompra; el tab Mis compras muestra la lista                                                                                                                                                                                                             |
| Back                     | sin cambios (cubierto por la spec 06)                                                                                                                                                                                                                                              |
| Manual                   | Expo Go y web: lista, filtros, cargar más, detalle, volver después de comprar                                                                                                                                                                                                      |
| E2E                      | spec temporal de Cypress contra el back real al cerrar la rama (se borra)                                                                                                                                                                                                          |

## Fuera de alcance

- Pagar y cancelar (spec 10c2, `feature/acciones-compra`): pagar sin diálogo, con Snackbar "Pago confirmado"; cancelar con diálogo de confirmación.
- Botones Reseñar (10d), Chat (12) y Marcar utilizada (11): cada uno llega con su spec.
- Actualización en vivo del estado por socket (`compra:estado`), que va con el chat (12).
- Mostrar la reseña de una compra utilizada (10d).

## Notas de IA

- La IA propuso partir CU1, CU7 y CU8 en dos specs porque juntas superaban los 8 escenarios; el usuario lo aceptó. También eligió las opciones recomendadas: chips "Todas" + 5 estados (1 a 1 con el contrato), botones de otras specs solo cuando llegue su spec, y pagar directo con Snackbar (para 10c2).
- La IA agregó sin preguntar (revisable):
  - refresco de la lista al recuperar el foco;
  - textos "Falta 1 día" y "Es hoy" para 1 y 0 días;
  - textos de vacío "Todavía no compraste entradas" / "No tenés compras en estado <Etiqueta>" y sus acciones;
  - 403 tratado igual que 404 (mensaje del back + Volver);
  - testIDs `filtro-estado-*`, `lista-compras`, `compra-estado`, `compra-evento`, `compra-total`, `linea-de-tiempo`, `historial-<n>`;
  - generalizar el hook de lista paginada de Explorar para que lo usen las dos pantallas.
