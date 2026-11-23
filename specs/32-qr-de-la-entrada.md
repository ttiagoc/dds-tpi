# Spec 32 — QR de la entrada y escaneo en la puerta

- **Estado:** implementada
- **Rama:** `feature/qr-de-la-entrada`
- **Casos de uso:** CU1 (ver mis compras), CU2 (organizador marca utilizada), CU9 (habilita reseña)
- **Iteración:** It5c
- **Depende de:** specs 10c (DetalleCompra), 11 (marcar utilizada), R4 y ADR-007

## Contexto
Hoy el comprador no tiene nada para mostrar en la puerta del evento, y el organizador marca cada compra como utilizada buscándola en la lista. La feature suma un QR en el detalle de la compra confirmada y un escáner en Compras del evento que lo lee y marca la compra como utilizada con el endpoint que ya existe.

## Historias
- Como comprador, quiero ver el QR de mi compra confirmada para mostrarlo en la entrada.
- Como organizador, quiero escanear el QR con la cámara y validar la entrada sin buscar la compra en la lista.

## Reglas
Se mantiene R4 (`planes/02`): marcar utilizada solo lo hace el organizador del evento y desde CONFIRMADA. El back no cambia: sigue validando permiso (403) y estado (422).

- **RQ1** El QR codifica el texto `aiticketit:compra:<id>`. Es una compra, no una entrada por persona: una compra de 3 entradas tiene un solo QR y se valida entera.
- **RQ2** El QR se ve solo en DetalleCompra, solo para el comprador dueño y solo con la compra en CONFIRMADA. En PENDIENTE se ve "Pagá la compra para ver tu entrada". En UTILIZADA, CANCELADA y REEMBOLSADA no se muestra nada.
- **RQ3** Al escanear, el front lee el id y pide la compra (`GET /compras/:id`). Si `evento.id` no es el del evento abierto, avisa "Esa entrada es de otro evento" y no la marca.
- **RQ4** Antes de marcar se muestran el comprador, el tipo × cantidad y el estado, y el organizador confirma con "Validar entrada". Si `acciones.puedeMarcarUtilizada` es `false`, no hay botón y se ve el motivo según el estado:
  - UTILIZADA: "Esta entrada ya fue utilizada"
  - PENDIENTE: "Esta compra todavía no está pagada"
  - CANCELADA o REEMBOLSADA: "Esta compra está cancelada"
- **RQ5** Un QR que no tiene el formato de RQ1 → "Ese QR no es una entrada de AI Ticket It". Los errores del back (403, 404) se muestran con su texto.

## Contrato de API
No hay endpoints nuevos ni cambios de contrato. Se usan:

| Método | Ruta | Uso |
|---|---|---|
| GET | `/compras/:id` | leer la compra escaneada (el organizador del evento ya puede verla) |
| POST | `/compras/:id/uso` | marcar utilizada (R4) |

## Pantallas
- **DetalleCompra**: tarjeta "Tu entrada" con el QR (`react-native-qrcode-svg` sobre `react-native-svg`, los dos funcionan en Expo Go) y el texto "Mostrá este código en la entrada". Colores del tema (QR oscuro sobre fondo claro también en tema oscuro, para que se pueda leer).
- **ComprasDelEvento**: botón "Escanear entrada" (`escanear-entrada`) arriba de la lista. Abre la ruta nueva `eventos/[id]/escanear`.
- **EscanearEntrada** (`eventos/[id]/escanear`, solo organizador, título "Escanear entrada"): `CameraView` de `expo-camera` con `barcodeScannerSettings={{ barcodeTypes: ["qr"] }}`. Al leer un QR se pausa el escaneo y se muestra el resultado (RQ3-RQ5). "Validar entrada" llama a `POST /compras/:id/uso` y muestra "Entrada validada" con un ícono. "Escanear otra" retoma la cámara.
  - Permiso de cámara denegado: "Necesitamos la cámara para escanear entradas" con un botón "Dar permiso".
  - Web: no hay escáner; se ve "El escáner está disponible en el celular" (`EscanearEntrada.web.jsx`).
  - Al volver a ComprasDelEvento la lista se recarga.
- testIDs: `compra-qr`, `compra-qr-pendiente`, `escanear-entrada`, `escaner-camara`, `escaner-resultado`, `escaner-validar`, `escaner-validada`, `escaner-otra`, `escaner-error`, `escaner-sin-permiso`.

## Criterios de aceptación
```gherkin
Escenario: el comprador ve el QR de su compra confirmada
  Dado que soy Ana y tengo la compra 7 CONFIRMADA
  Cuando abro su detalle
  Entonces veo el QR con "aiticketit:compra:7"

Escenario: compra pendiente
  Dado que tengo una compra PENDIENTE
  Cuando abro su detalle
  Entonces no veo el QR y veo "Pagá la compra para ver tu entrada"

Escenario: el organizador valida una entrada
  Dado que soy Fénix y abro el escáner del Congreso de Innovación
  Cuando escaneo el QR de la compra 7, confirmada y de ese evento
  Entonces veo "Ana Pérez", "General × 2" y el botón "Validar entrada"
  Cuando lo toco
  Entonces la compra pasa a UTILIZADA y veo "Entrada validada"

Escenario: entrada ya utilizada
  Cuando escaneo una compra UTILIZADA
  Entonces veo "Esta entrada ya fue utilizada" y no hay botón para validar

Escenario: entrada de otro evento
  Cuando escaneo una compra de otro evento
  Entonces veo "Esa entrada es de otro evento"

Escenario: QR ajeno
  Cuando escaneo un QR que no es de la app
  Entonces veo "Ese QR no es una entrada de AI Ticket It"

Escenario: sin permiso de cámara
  Dado que negué el permiso de cámara
  Cuando abro el escáner
  Entonces veo "Necesitamos la cámara para escanear entradas" y el botón "Dar permiso"
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio / service | sin cambios (R4 ya cubierta) |
| Integración | sin cambios |
| Front unit | `textoDelQr(id)` y `leerQrDeEntrada(texto)`: formato válido, prefijo ajeno, id no numérico |
| Front (RNTL) | DetalleCompra: QR en CONFIRMADA para el comprador, aviso en PENDIENTE, nada en el resto y para el organizador. EscanearEntrada (`expo-camera` mockeado): lectura válida, validar → "Entrada validada", ya utilizada, pendiente, cancelada, otro evento, QR ajeno, 403/404 del back, sin permiso |
| E2E | no (Cypress corre en web, sin cámara) |
| Manual | iPhone: el comprador muestra el QR y el organizador lo escanea desde otro celular |

## Fuera de alcance
- Un QR por persona dentro de una misma compra.
- Código firmado o difícil de adivinar (la seguridad la da el back: permiso y estado).
- Validar sin conexión.
- Guardar el QR en la billetera del celular.
- Agrupar compras del mismo evento en Mis compras (se habló; va en otra spec si se quiere).

## Notas de IA
El usuario preguntó dónde estaba el QR de su entrada y no existía. La IA propuso tres decisiones con opción recomendada y el usuario eligió las tres: el QR lleva el id de la compra, sin cambiar el contrato; el organizador lo escanea con `expo-camera` reusando `POST /compras/:id/uso`; y solo se muestra en CONFIRMADA. Sin que el usuario lo pidiera, la IA agregó un paso de confirmación antes de marcar la compra y el control de que la entrada sea del evento abierto, porque el back solo verifica que el organizador sea dueño del evento de la compra. El usuario también preguntó si dos compras del mismo evento deberían agruparse: la IA explicó que cada compra es una transacción con su propio estado, pago y cancelación, y que lo correcto es mantenerlas separadas y, si acaso, agruparlas solo en la vista.
