# Spec 33 — Entradas individuales con un QR cada una

- **Estado:** implementada
- **Rama:** `feature/entradas-individuales`
- **Casos de uso:** CU1, CU2, CU9
- **Iteración:** It5c
- **Depende de:** spec 32 (QR y escáner), R4

## Contexto
En la spec 32 el QR era por compra: una compra de 2 entradas tenía un solo código y validarlo marcaba la compra entera. Al probarlo, el usuario pidió ver un QR por cada entrada comprada y que cada persona pueda entrar por separado. Esta spec reemplaza RQ1 y RQ2 de la spec 32.

## Historias
- Como comprador de 2 entradas, quiero deslizar entre "Entrada 1 de 2" y "Entrada 2 de 2" para pasarle una a quien viene conmigo.
- Como organizador, quiero validar cada entrada por separado en la puerta.

## Reglas
- **R16** Entradas de una compra: al crearla se generan `cantidad` entradas numeradas de 1 a `cantidad`, cada una con `fechaUso: null`. No tienen id global: se identifican por compra y número.
- **R17** Validar una entrada: solo el organizador del evento (403). La compra tiene que estar CONFIRMADA o UTILIZADA:
  - PENDIENTE → 422 "La compra todavía no está pagada"
  - CANCELADA o REEMBOLSADA → 422 "La compra está cancelada"
  - Número fuera de rango → 404 "No existe la entrada"
  - Entrada ya usada → 422 "Esta entrada ya fue utilizada"
  
  Al validar la primera entrada, la compra pasa de CONFIRMADA a UTILIZADA (con su cambio en el historial): se habilita la reseña (R5) y ya no se puede cancelar (R2). Las demás entradas se pueden seguir validando.
- **R4 (se ajusta)** Marcar utilizada la compra entera (`POST /compras/:id/uso`, botón de DetalleCompra) marca como usadas todas las entradas pendientes.
- **QR**: `aiticketit:compra:<compraId>:entrada:<numero>`. El formato de la spec 32 (`aiticketit:compra:<id>`) deja de ser válido.

## Contrato de API
`CompraDetalle` suma `entradas: [{ numero, fechaUso: string | null, puedeValidarse: boolean }]`. `puedeValidarse` es `true` solo para el organizador del evento, con la compra CONFIRMADA o UTILIZADA y la entrada sin usar; el front no reimplementa la regla. `CompraResumen` no cambia.

| Método | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/compras/:id/entradas/:numero/uso` | 🅞 organizador del evento | — | 200 CompraDetalle con las acciones del organizador | 400 (ids), 401, 403, 404 "No existe la compra" / "No existe la entrada", 422 (R17) |

Si la compra cambia de estado, se emite `compra:estado` como con el uso actual.

## Pantallas
- **DetalleCompra (comprador)**: "Ver QR" (una entrada) o "Ver las N entradas" (`compra-ver-qr`), visible con la compra CONFIRMADA o UTILIZADA. El modal tiene una lista horizontal paginada (`FlatList` con `pagingEnabled`, `compra-qr-entradas`): cada página muestra "Entrada 2 de 3", el QR y, si ya se usó, el QR atenuado con "Usada" (`entrada-<n>-usada`). Abajo, puntos que indican la página (`compra-qr-pagina`). Se mantiene el brillo al máximo.
- **DetalleCompra (ambos roles)**: con más de una entrada y alguna usada, debajo del resumen: "Entradas usadas: 1 de 2" (`compra-entradas-usadas`).
- **EscanearEntrada**: lee compra y número; muestra comprador, "Entrada 2 de 3 · General" y el estado. "Validar entrada" llama al endpoint nuevo. Si `puedeValidarse` es `false`, se muestra el motivo: "Esta entrada ya fue utilizada", "Esta compra todavía no está pagada" o "Esta compra está cancelada". Después de validar: "Entrada validada" y, si quedan entradas sin usar, "Quedan N entradas de esta compra" ("Queda 1 entrada de esta compra" si es una).

## Criterios de aceptación
```gherkin
Escenario: deslizar entre las entradas
  Dado que soy Ana y compré 2 entradas generales, ya pagadas
  Cuando toco "Ver las 2 entradas"
  Entonces veo "Entrada 1 de 2" con su QR y, al deslizar, "Entrada 2 de 2" con otro QR

Escenario: validar la primera entrada
  Dado que soy Fénix y escaneo la entrada 1 de esa compra
  Cuando toco "Validar entrada"
  Entonces la entrada 1 queda usada, la compra pasa a UTILIZADA y veo "Queda 1 entrada de esta compra"

Escenario: validar la segunda después
  Dado que la entrada 1 ya se usó
  Cuando escaneo y valido la entrada 2
  Entonces queda usada y la compra sigue UTILIZADA

Escenario: entrada repetida
  Cuando escaneo otra vez la entrada 1
  Entonces veo "Esta entrada ya fue utilizada" y no hay botón para validar

Escenario: el comprador ve cuál se usó
  Dado que la entrada 1 se usó
  Cuando Ana abre sus entradas
  Entonces la entrada 1 aparece atenuada con "Usada" y la 2 se ve normal

Escenario: número inexistente
  Cuando el organizador valida la entrada 5 de una compra de 2
  Entonces responde 404 "No existe la entrada"

Escenario: marcar utilizada la compra entera
  Cuando el organizador marca utilizada una compra de 3 entradas desde el detalle
  Entonces las 3 entradas quedan usadas
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio | `Compra.crear` genera N entradas; `validarEntrada`: primera pasa a UTILIZADA, segunda no cambia el estado, ya usada 422, fuera de rango 404, PENDIENTE 422, cancelada 422; `marcarUtilizada` usa todas; `entradasPara(usuario)` con `puedeValidarse` según rol y estado |
| Unit service | `validarEntrada`: permiso del organizador (403), guarda y emite `compra:estado` solo si cambió el estado |
| Integración | `POST /compras/:id/entradas/:numero/uso`: 200, 400, 401, 403 (comprador u otro organizador), 404 compra y entrada, 422; `GET /compras/:id` devuelve `entradas` |
| Seed | las compras UTILIZADA tienen todas sus entradas usadas |
| Front unit | `textoDelQr(compraId, numero)` y `leerQrDeEntrada` con el formato nuevo |
| Front (RNTL) | modal con N páginas y "Usada"; "Ver QR" o "Ver las N entradas"; escáner con el endpoint nuevo, motivos y "Quedan N" |
| E2E | el flujo `utilizada-y-resenia` sigue pasando (usa el botón de marcar la compra entera) |
| Swagger | endpoint nuevo y `entradas` en CompraDetalle |

## Fuera de alcance
- Transferir una entrada a otra cuenta.
- Cancelar o reembolsar entradas sueltas: la cancelación sigue siendo por compra.
- Nombre de la persona en cada entrada.

## Notas de IA
El usuario pidió ver todas las entradas compradas y deslizar entre ellas. La IA planteó tres alternativas (entradas en el dominio, un carrusel con el mismo QR o un QR que vale por N) y desaconsejó el carrusel porque validar cualquier QR habría marcado la compra entera. El usuario eligió las entradas en el dominio y que la compra pase a UTILIZADA al validar la primera. La IA propuso que el back mande `puedeValidarse` en cada entrada para que el escáner no reimplemente la regla.
