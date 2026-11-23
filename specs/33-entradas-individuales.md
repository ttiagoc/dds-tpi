# Spec 33 â€” Entradas individuales con un QR cada una

- **Estado:** aprobada
- **Rama:** `feature/entradas-individuales`
- **Casos de uso:** CU1, CU2, CU9
- **IteraciÃ³n:** It5c
- **Depende de:** spec 32 (QR y escÃ¡ner), R4

## Contexto
En la spec 32 el QR era por compra: una compra de 2 entradas tenÃ­a un solo cÃ³digo y validarlo marcaba la compra entera. Al probarlo, el usuario pidiÃ³ ver un QR por cada entrada comprada y que cada persona pueda entrar por separado. Esta spec reemplaza RQ1 y RQ2 de la spec 32.

## Historias
- Como comprador de 2 entradas, quiero deslizar entre "Entrada 1 de 2" y "Entrada 2 de 2" para pasarle una a quien viene conmigo.
- Como organizador, quiero validar cada entrada por separado en la puerta.

## Reglas
- **R16** Entradas de una compra: al crearla se generan `cantidad` entradas numeradas de 1 a `cantidad`, cada una con `fechaUso: null`. No tienen id global: se identifican por compra y nÃºmero.
- **R17** Validar una entrada: solo el organizador del evento (403). La compra tiene que estar CONFIRMADA o UTILIZADA:
  - PENDIENTE â†’ 422 "La compra todavÃ­a no estÃ¡ pagada"
  - CANCELADA o REEMBOLSADA â†’ 422 "La compra estÃ¡ cancelada"
  - NÃºmero fuera de rango â†’ 404 "No existe la entrada"
  - Entrada ya usada â†’ 422 "Esta entrada ya fue utilizada"
  
  Al validar la primera entrada, la compra pasa de CONFIRMADA a UTILIZADA (con su cambio en el historial): se habilita la reseÃ±a (R5) y ya no se puede cancelar (R2). Las demÃ¡s entradas se pueden seguir validando.
- **R4 (se ajusta)** Marcar utilizada la compra entera (`POST /compras/:id/uso`, botÃ³n de DetalleCompra) marca como usadas todas las entradas pendientes.
- **QR**: `aiticketit:compra:<compraId>:entrada:<numero>`. El formato de la spec 32 (`aiticketit:compra:<id>`) deja de ser vÃ¡lido.

## Contrato de API
`CompraDetalle` suma `entradas: [{ numero, fechaUso: string | null, puedeValidarse: boolean }]`. `puedeValidarse` es `true` solo para el organizador del evento, con la compra CONFIRMADA o UTILIZADA y la entrada sin usar; el front no reimplementa la regla. `CompraResumen` no cambia.

| MÃ©todo | Ruta | Auth | Entrada | Respuesta | Errores |
|---|---|---|---|---|---|
| POST | `/compras/:id/entradas/:numero/uso` | ðŸ…ž organizador del evento | â€” | 200 CompraDetalle con las acciones del organizador | 400 (ids), 401, 403, 404 "No existe la compra" / "No existe la entrada", 422 (R17) |

Si la compra cambia de estado, se emite `compra:estado` como con el uso actual.

## Pantallas
- **DetalleCompra (comprador)**: "Ver QR" (una entrada) o "Ver las N entradas" (`compra-ver-qr`), visible con la compra CONFIRMADA o UTILIZADA. El modal tiene una lista horizontal paginada (`FlatList` con `pagingEnabled`, `compra-qr-entradas`): cada pÃ¡gina muestra "Entrada 2 de 3", el QR y, si ya se usÃ³, el QR atenuado con "Usada" (`entrada-<n>-usada`). Abajo, puntos que indican la pÃ¡gina (`compra-qr-pagina`). Se mantiene el brillo al mÃ¡ximo.
- **DetalleCompra (ambos roles)**: con mÃ¡s de una entrada y alguna usada, debajo del resumen: "Entradas usadas: 1 de 2" (`compra-entradas-usadas`).
- **EscanearEntrada**: lee compra y nÃºmero; muestra comprador, "Entrada 2 de 3 Â· General" y el estado. "Validar entrada" llama al endpoint nuevo. Si `puedeValidarse` es `false`, se muestra el motivo: "Esta entrada ya fue utilizada", "Esta compra todavÃ­a no estÃ¡ pagada" o "Esta compra estÃ¡ cancelada". DespuÃ©s de validar: "Entrada validada" y, si quedan entradas sin usar, "Quedan N entradas de esta compra".

## Criterios de aceptaciÃ³n
```gherkin
Escenario: deslizar entre las entradas
  Dado que soy Ana y comprÃ© 2 entradas generales, ya pagadas
  Cuando toco "Ver las 2 entradas"
  Entonces veo "Entrada 1 de 2" con su QR y, al deslizar, "Entrada 2 de 2" con otro QR

Escenario: validar la primera entrada
  Dado que soy FÃ©nix y escaneo la entrada 1 de esa compra
  Cuando toco "Validar entrada"
  Entonces la entrada 1 queda usada, la compra pasa a UTILIZADA y veo "Quedan 1 entradas de esta compra"

Escenario: validar la segunda despuÃ©s
  Dado que la entrada 1 ya se usÃ³
  Cuando escaneo y valido la entrada 2
  Entonces queda usada y la compra sigue UTILIZADA

Escenario: entrada repetida
  Cuando escaneo otra vez la entrada 1
  Entonces veo "Esta entrada ya fue utilizada" y no hay botÃ³n para validar

Escenario: el comprador ve cuÃ¡l se usÃ³
  Dado que la entrada 1 se usÃ³
  Cuando Ana abre sus entradas
  Entonces la entrada 1 aparece atenuada con "Usada" y la 2 se ve normal

Escenario: nÃºmero inexistente
  Cuando el organizador valida la entrada 5 de una compra de 2
  Entonces responde 404 "No existe la entrada"

Escenario: marcar utilizada la compra entera
  Cuando el organizador marca utilizada una compra de 3 entradas desde el detalle
  Entonces las 3 entradas quedan usadas
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio | `Compra.crear` genera N entradas; `validarEntrada`: primera pasa a UTILIZADA, segunda no cambia el estado, ya usada 422, fuera de rango 404, PENDIENTE 422, cancelada 422; `marcarUtilizada` usa todas; `entradasPara(usuario)` con `puedeValidarse` segÃºn rol y estado |
| Unit service | `validarEntrada`: permiso del organizador (403), guarda y emite `compra:estado` solo si cambiÃ³ el estado |
| IntegraciÃ³n | `POST /compras/:id/entradas/:numero/uso`: 200, 400, 401, 403 (comprador u otro organizador), 404 compra y entrada, 422; `GET /compras/:id` devuelve `entradas` |
| Seed | las compras UTILIZADA tienen todas sus entradas usadas |
| Front unit | `textoDelQr(compraId, numero)` y `leerQrDeEntrada` con el formato nuevo |
| Front (RNTL) | modal con N pÃ¡ginas y "Usada"; "Ver QR" o "Ver las N entradas"; escÃ¡ner con el endpoint nuevo, motivos y "Quedan N" |
| E2E | el flujo `utilizada-y-resenia` sigue pasando (usa el botÃ³n de marcar la compra entera) |
| Swagger | endpoint nuevo y `entradas` en CompraDetalle |

## Fuera de alcance
- Transferir una entrada a otra cuenta.
- Cancelar o reembolsar entradas sueltas: la cancelaciÃ³n sigue siendo por compra.
- Nombre de la persona en cada entrada.

## Notas de IA
El usuario pidiÃ³ ver todas las entradas compradas y deslizar entre ellas. La IA planteÃ³ tres alternativas (entradas en el dominio, un carrusel con el mismo QR o un QR que vale por N) y desaconsejÃ³ el carrusel porque validar cualquier QR habrÃ­a marcado la compra entera. El usuario eligiÃ³ las entradas en el dominio y que la compra pase a UTILIZADA al validar la primera. La IA propuso que el back mande `puedeValidarse` en cada entrada para que el escÃ¡ner no reimplemente la regla.
