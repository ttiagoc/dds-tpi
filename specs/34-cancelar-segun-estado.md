# Spec 34 â€” CancelaciÃ³n distinta segÃºn el estado

- **Estado:** aprobada
- **Rama:** `feature/cancelar-segun-estado`
- **Casos de uso:** CU7, CU8
- **IteraciÃ³n:** It5c
- **Depende de:** spec 10c2 (acciones de la compra), R2

## Contexto
En DetalleCompra, una compra PENDIENTE muestra "Pagar" y, debajo, el mismo botÃ³n rojo "Cancelar compra" que una compra CONFIRMADA. El usuario no entendÃ­a por quÃ© podÃ­a cancelar algo que todavÃ­a no habÃ­a pagado. El dominio no cambia: cancelar una PENDIENTE libera el cupo reservado y cancelar una CONFIRMADA lo libera y reembolsa (R2). Lo que cambia es cÃ³mo se presenta cada caso.

## Historias
- Como comprador con una compra sin pagar, quiero entender que mis entradas estÃ¡n reservadas y que puedo liberarlas.
- Como comprador con una compra pagada, quiero ver la opciÃ³n de pedir el reembolso y cuÃ¡nto me devuelven.

## Reglas
R2 sin cambios. El botÃ³n se sigue mostrando segÃºn `acciones.puedeCancelar`.

## Contrato de API
Sin cambios (`POST /compras/:id/cancelacion`).

## Pantallas
DetalleCompra, `AccionesCompra` (testIDs sin cambios: `compra-cancelar`, `confirmar-cancelacion`):

| Estado | BotÃ³n | Texto arriba | DiÃ¡logo | Aviso al terminar |
|---|---|---|---|---|
| PENDIENTE | "Liberar reserva", modo `text` | "Tus entradas quedan reservadas hasta que pagues." (`compra-reserva`) | "Â¿Liberar la reserva?" Â· "Se libera la entrada." / "Se liberan las N entradas." Â· botÃ³n "Liberar" | "Reserva liberada" |
| CONFIRMADA | "Pedir reembolso", modo `outlined` | â€” | "Â¿Pedir el reembolso?" Â· "Se liberan las N entradas y se te reembolsan $ X." Â· botÃ³n "Pedir reembolso" | "Compra cancelada y reembolsada" |

En los dos casos el color sigue siendo el de error (acciÃ³n destructiva).

## Criterios de aceptaciÃ³n
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
  Entonces el diÃ¡logo dice "Se liberan las 2 entradas y se te reembolsan $ 90.000."
  Cuando confirmo
  Entonces la compra queda REEMBOLSADA y veo "Compra cancelada y reembolsada"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front (RNTL) | etiqueta, modo y texto de reserva segÃºn el estado; tÃ­tulo, texto y botÃ³n del diÃ¡logo; avisos |
| E2E | revisar que ningÃºn flujo dependa del texto "Cancelar compra" |

## Fuera de alcance
- Vencimiento automÃ¡tico de las reservas sin pagar.

## Notas de IA
El usuario preguntÃ³ por quÃ© aparecÃ­a "Cancelar compra" en una compra sin pagar. La IA explicÃ³ que el cupo queda reservado desde la compra y propuso tres presentaciones; el usuario eligiÃ³ diferenciar el botÃ³n segÃºn el estado, con "Liberar reserva" y "Pedir reembolso".
