# Spec 23 — Publicar evento: validación en el front y en el back

- **Estado:** implementada
- **Rama:** `fix/publicar-evento`
- **Casos de uso:** CU4 (ver `planes/00-indice.md`)
- **Iteración:** It5c (ajustes tras la prueba en Expo Go)
- **Depende de:** spec 11b (crear evento), spec 21 (subir imagen)

## Contexto
En la prueba en el celular, publicar un evento con foto devolvía 400 "Datos inválidos" y la pantalla no avisaba nada: el botón seguía activo y no pasaba nada. La causa: `POST /imagenes` devuelve una ruta relativa (`/imagenes/subidas/<uuid>.jpg`), que `planes/03` acepta en `multimedia`, pero `crearEventoValidation` solo aceptaba URLs `http(s)`. Además, "Publicar evento" se deshabilitaba sin decir qué faltaba (por ejemplo, la hora) y el calendario dejaba elegir días pasados, que el back rechaza con 422.

## Historias
- Como organizador, quiero que al tocar "Publicar evento" la app me diga qué campo falta o está mal y me lleve hasta él.
- Como organizador, quiero que el calendario no me deje elegir un día que ya pasó.
- Como organizador con lector de pantalla, quiero que se anuncien los errores y que cada campo diga el suyo.

## Reglas de negocio
Sin reglas nuevas. Se respeta R8 (`planes/02-dominio.md`): fecha futura (`Evento.crear`), ≥ 1 tipo, nombres de tipo únicos, precio ≥ 0, cupo ≥ 1. El front valida lo mismo para avisar antes, pero el back sigue siendo la autoridad.

- **RV1** `multimedia` acepta URLs `http(s)` **o** rutas relativas del back que empiecen con `/imagenes/` (como ya decía el contrato).
- **RV2** Los 422 de "fecha futura" y "categoría inexistente" incluyen `details: [{ campo, mensaje }]`, con el mismo formato que los 400 de zod (`campo` = `fecha` / `categoriaId`), para que el front marque el campo.

## Contrato de API
Sin endpoints nuevos. `POST /eventos`:
- `multimedia`: cada elemento es una URL `http(s)` o una ruta `/imagenes/...`.
- 422 "La fecha del evento tiene que ser futura" → `details: [{ campo: "fecha", mensaje: "La fecha del evento tiene que ser futura" }]`.
- 422 "La categoría no existe" → `details: [{ campo: "categoriaId", mensaje: "La categoría no existe" }]`.

## Pantallas
**CrearEvento**:
- "Publicar evento" (`evento-guardar`) está siempre habilitado, salvo mientras envía o sube la imagen.
- Al tocarlo, `validarEvento(valores, ahora)` revisa en orden: nombre (3 a 100 caracteres), descripción, lugar, categoría, fecha, hora, fecha y hora futuras, y en cada tipo nombre, precio (número ≥ 0) y cupo (entero ≥ 1).
- Si hay errores, no envía. Muestra cada error con `HelperText` debajo de su campo (`<testID del campo>-error`), pone el `TextInput` en estado `error` y lleva el foco al primer campo con error. A los `TextInput` les hace `focus()`; a fecha, hora y categoría les hace scroll a su posición y les pasa el foco de accesibilidad. Además anuncia "Revisá N campos" (`announceForAccessibility`).
- El error de un campo se limpia al editarlo.
- Si el back responde 400 o 422, cada `details` se muestra en su campo. `tiposEntrada.0.precio` va a `tipo-0-precio`; `categoriaId` va a la categoría; `fecha` va a la fecha. El `message` general aparece en un `Snackbar` (`evento-aviso-error`) y en `evento-error`.
- Calendario: `DatePickerModal` con `validRange={{ startDate: hoy }}`.

Mensajes del front (voseo):

| Campo | Mensaje |
|---|---|
| nombre | "El nombre tiene que tener entre 3 y 100 caracteres" |
| descripción | "Escribí una descripción" |
| lugar | "Indicá el lugar" |
| categoría | "Elegí una categoría" |
| fecha / hora | "Elegí la fecha" / "Elegí la hora" |
| fecha y hora | "La fecha del evento tiene que ser futura" |
| tipo nombre | "Poné un nombre" |
| precio | "Ingresá un precio válido" |
| cupo | "El cupo tiene que ser un número entero mayor a 0" |

## Criterios de aceptación
```gherkin
Escenario: publicar con foto subida
  Dado que soy Fénix y subí una portada (url /imagenes/subidas/x.jpg)
  Cuando publico un evento válido
  Entonces POST /eventos responde 201 y el evento tiene esa imagen

Escenario: publicar con campos vacíos
  Dado que estoy en Nuevo evento sin completar nada
  Cuando toco "Publicar evento"
  Entonces no se llama a la API, se ve "El nombre tiene que tener entre 3 y 100 caracteres" y el foco va al nombre

Escenario: falta solo la hora
  Dado que completé todo menos la hora
  Cuando toco "Publicar evento"
  Entonces se ve "Elegí la hora" junto al botón de hora y la pantalla scrollea hasta ahí

Escenario: fecha y hora en el pasado
  Dado que elegí hoy y una hora que ya pasó
  Cuando toco "Publicar evento"
  Entonces se ve "La fecha del evento tiene que ser futura"

Escenario: el back rechaza la fecha
  Cuando el back responde 422 con details en fecha
  Entonces el error aparece en la fecha y en el aviso, y no se pierde lo cargado

Escenario: integración 422 con detalle
  Cuando Fénix hace POST /eventos con una fecha pasada
  Entonces responde 422 "La fecha del evento tiene que ser futura" con details [{ campo: "fecha" }]
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit validación | `crearEventoValidation`: acepta `/imagenes/subidas/x.jpg` y `https://...`; rechaza `ftp://`, `imagenes/x.jpg` (sin barra) y `/otra/x.jpg` |
| Unit dominio | `Evento.crear` con fecha pasada y con la fecha igual a ahora → error con `details` en `fecha` |
| Unit service | `EventoService.crear` con categoría inexistente → 422 con `details` en `categoriaId` |
| Integración | 201 con la url que devuelve `POST /imagenes`; 422 fecha pasada con `details` |
| Front unit | `validarEvento`: cada campo, el orden de los errores, la fecha y hora futuras con `ahora` inyectado |
| Front (RNTL) | publicar vacío muestra los errores y no llama a la API; el error se limpia al editar; 400 y 422 con `details` marcan el campo; Snackbar con el mensaje; el body manda la ruta relativa de la imagen |
| E2E | crear evento: tocar Publicar vacío muestra un error y después se completa y se publica |

## Fuera de alcance
- Validar mientras se escribe (la validación corre al tocar Publicar y al editar se limpia el error).
- El teclado que tapa campos y el teclado numérico se resuelven en la spec 24.

## Notas de IA
El bug de `multimedia` lo introdujo la IA en la spec 21: actualizó el contrato pero no la validación zod, y los tests no cubrían crear un evento con la url real de `POST /imagenes`. Lo encontró el usuario al probar en el celular. La IA propuso dejar el botón siempre habilitado y llevar el foco al primer error; el pedido original del usuario iba en esa línea.
