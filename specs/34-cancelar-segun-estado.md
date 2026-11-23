# Spec 34 — Cancelación distinta según el estado

- **Estado:** aprobada
- **Rama:** `feature/cancelar-segun-estado`
- **Casos de uso:** CU7, CU8
- **Iteración:** It5c
- **Depende de:** spec 10c2 (acciones de la compra), R2

## Contexto
En DetalleCompra, una compra PENDIENTE muestra "Pagar" y, debajo, el mismo botón rojo "Cancelar compra" que una compra CONFIRMADA. El usuario no entendía por qué podía cancelar algo que todavía no había pagado. El dominio no cambia: cancelar una PENDIENTE libera el cupo reservado y cancelar una CONFIRMADA lo libera y reembolsa (R2). Lo que cambia es cómo se presenta cada caso.

## Historias
- Como comprador con una compra sin pagar, quiero entender que mis entradas están reservadas y que puedo liberarlas.
- Como comprador con una compra pagada, quiero ver la opción de pedir el reembolso y cuánto me devuelven.

## Reglas
R2 sin cambios. El botón se sigue mostrando según `acciones.puedeCancelar`.

## Contrato de API
Sin cambios (`POST /compras/:id/cancelacion`).

## Pantallas
DetalleCompra, `AccionesCompra` (testIDs sin cambios: `compra-cancelar`, `confirmar-cancelacion`):

| Estado | Botón | Texto arriba | Diálogo | Aviso al terminar |
|---|---|---|---|---|
| PENDIENTE | "Liberar reserva", modo `text` | "Tus entradas quedan reservadas hasta que pagues." (`compra-reserva`) | "¿Liberar la reserva?" · "Se libera la entrada." / "Se liberan las N entradas." · botón "Liberar" | "Reserva liberada" |
| CONFIRMADA | "Pedir reembolso", modo `outlined` | — | "¿Pedir el reembolso?" · "Se liberan las N entradas y se te reembolsan $ X." · botón "Pedir reembolso" | "Compra cancelada y reembolsada" |

En los dos casos el color sigue siendo el de error (acción destructiva).

## Criterios de aceptación
```gherkin
Escenario: compra sin pagar
  Dado una compra PENDIENTE de 2 entradas
  Entonces veo "Pagar", el texto "Tus entradas quedan reservadas hasta que pagues." y "Liberar reserva"
  Cuando toco "Liberar reserva" y confirmo con "Liberar"
  Entonces la compra queda CANCELADA y veo "Reserva liberada"

Escenario: compra pagada
  Dado una compra CONFIRMADA de $ 90.000
  Entonces veo "Pedir reembolso" y no veo "Liberar reserva"
  Cuando lo toco
  Entonces el diálogo dice "Se liberan las 2 entradas y se te reembolsan $ 90.000."
  Cuando confirmo
  Entonces la compra queda REEMBOLSADA y veo "Compra cancelada y reembolsada"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front (RNTL) | etiqueta, modo y texto de reserva según el estado; título, texto y botón del diálogo; avisos |
| E2E | revisar que ningún flujo dependa del texto "Cancelar compra" |

## Fuera de alcance
- Vencimiento automático de las reservas sin pagar.

## Notas de IA
El usuario preguntó por qué aparecía "Cancelar compra" en una compra sin pagar. La IA explicó que el cupo queda reservado desde la compra y propuso tres presentaciones; el usuario eligió diferenciar el botón según el estado, con "Liberar reserva" y "Pedir reembolso".
