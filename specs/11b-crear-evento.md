# Spec 11b — Crear evento

- **Estado:** implementada
- **Rama:** `feature/crear-evento`
- **Casos de uso:** CU4 (ver `planes/00-indice.md`)
- **Iteración:** It4
- **Depende de:** spec 05b (`POST /eventos`, R8), spec 05 (`GET /categorias`), spec 11 (Mis eventos)

## Contexto

El organizador ya ve sus eventos y las ventas (spec 11), pero todavía no puede publicar uno nuevo desde la app. Esta spec agrega el formulario de creación con sus tipos de entrada (precio y cupo), que es lo que pide CU4. El back ya valida todo (spec 05b): forma y tipos con zod (400) y las reglas de R8 en el dominio (422).

## Historias

- Como organizador, quiero crear un evento con distintos tipos de entrada, cada uno con su precio y cupo, para adaptarme a diferentes públicos y presupuestos (CU4).

## Reglas de negocio

Sin reglas nuevas. Aplica R8 de `planes/02-dominio.md`, que valida el back: fecha futura, al menos un tipo, nombres de tipo únicos (sin distinguir mayúsculas ni acentos), precio ≥ 0, cupo entero ≥ 1, nombre de 3 a 100 caracteres, categoría existente. El front **no** repite estas reglas.

Reglas de la pantalla:

- **RC1 Acceso.** FAB "Nuevo evento" (`fab-nuevo-evento`, ícono `plus`) en Mis eventos, también en el estado vacío. Abre `eventos/nuevo`, ruta protegida para ORGANIZADOR con título "Nuevo evento".
- **RC2 Campos del evento.** `TextInput mode="outlined"`:
  - "Nombre" (`evento-nombre`), "Descripción" multilínea (`evento-descripcion`, `maxLength` 2000), "Lugar" (`evento-lugar`), "URL de la imagen (opcional)" (`evento-imagen`, teclado `url`, sin mayúscula automática);
  - "Categoría": botón que abre un `Menu` con `GET /categorias` (`evento-categoria`, ítems `categoria-<id>`); si las categorías no cargan, `HelperText` de error con "Reintentar";
  - "Fecha" (`evento-fecha`) abre `DatePickerModal` y "Hora" (`evento-hora`) abre `TimePickerModal` de `react-native-paper-dates` (en castellano). Muestran lo elegido con `formatearFecha`. Se combinan en la hora local del dispositivo y se mandan en ISO UTC.
- **RC3 Tipos de entrada.** Arranca con un tipo vacío. Cada tipo (`tipo-<i>`, i desde 0) tiene "Nombre" (`tipo-<i>-nombre`), "Precio" (`tipo-<i>-precio`, teclado numérico), "Cupo" (`tipo-<i>-cupo`, teclado numérico) y "Descripción (opcional)" (`tipo-<i>-descripcion`). "Agregar tipo" (`tipo-agregar`) suma uno vacío hasta 10 (después se deshabilita). "Quitar" (`tipo-<i>-quitar`, `IconButton` con `accessibilityLabel` "Quitar tipo <n>") no se muestra si queda uno solo.
- **RC4 Completitud local.** "Publicar evento" (`evento-guardar`) queda deshabilitado hasta que estén nombre, descripción, lugar, categoría, fecha, hora y, en cada tipo, nombre, precio y cupo con un número. Es solo completitud: rangos y reglas de R8 los responde el back.
- **RC5 Envío.** Con `useEnvio` (loading en "Publicar evento", formulario deshabilitado, sin doble pedido). Body de `POST /eventos`: textos sin espacios de los costados; `precio` y `cupo` con `Number`; `multimedia: [url]` si hay imagen y `[]` si no; `descripcion` del tipo solo si no está vacía. Éxito (201) → `router.dismissTo({ pathname: "/mis-eventos", params: { aviso: "evento-creado" } })`: Mis eventos recarga al recuperar el foco y muestra el Snackbar "Evento publicado".
- **RC6 Errores.** Cualquier error del envío se muestra con el texto de `mensajeDeError` en un `HelperText` sobre "Publicar evento" (`evento-error`), sin perder lo cargado, y se limpia al reintentar. Por ejemplo 422 "La fecha del evento tiene que ser futura", "Ya hay un tipo de entrada llamado <nombre>", "El precio no puede ser negativo", "El cupo tiene que ser un entero mayor a 0", "La categoría no existe", o 400 "Datos inválidos". No se recarga nada.

## Contrato de API

Sin cambios. Usa tal cual `planes/03`:

| Función | Endpoint |
| --- | --- |
| `eventosApi.crearEvento(evento)` | `POST /eventos` → 201 `EventoDetalle` |
| `categoriasApi.listarCategorias()` (existente) | `GET /categorias` |

## Pantallas

- **CrearEvento** (`eventos/nuevo`, `src/pantallas/crear-evento/`): testIDs de RC1-RC6. La lógica del formulario va en un hook (`useFormularioEvento`) y los tipos en un componente propio (`TiposDeEntrada`).
- **MisEventos**: suma `fab-nuevo-evento` y el Snackbar (`mis-eventos-aviso`). El aviso por parámetro de ruta que hoy vive en DetalleCompra pasa a un hook compartido (`useAvisoDeRuta`).
- Dependencia nueva: `react-native-paper-dates` (con `npx expo install`), registrada en un ADR.

## Criterios de aceptación

```gherkin
Escenario: abrir el formulario desde Mis eventos
  Dado que estoy logueado como Fénix en "Mis eventos"
  Cuando toco "Nuevo evento"
  Entonces veo el formulario con un tipo de entrada vacío y "Publicar evento" deshabilitado

Escenario: Publicar habilitado solo con el formulario completo
  Dado que completé todos los campos menos el cupo del único tipo
  Entonces "Publicar evento" está deshabilitado
  Cuando escribo el cupo "200"
  Entonces "Publicar evento" está habilitado

Escenario: agregar y quitar tipos de entrada
  Dado que estoy en el formulario
  Cuando toco "Agregar tipo"
  Entonces veo dos tipos y cada uno con "Quitar"
  Cuando quito el primero
  Entonces queda uno solo, sin "Quitar"
  Y con 10 tipos "Agregar tipo" está deshabilitado

Escenario: publicar un evento
  Dado que completé el evento "Stand-up en el Konex" de Stand-up, el 5/12/2026 a las 22:00, en "Ciudad Cultural Konex", sin imagen, con el tipo "General" a 15000 y cupo 200
  Cuando toco "Publicar evento"
  Entonces se envía POST /eventos con categoriaId, la fecha en ISO, multimedia [] y el tipo con precio 15000 y cupo 200
  Y vuelvo a "Mis eventos" con el aviso "Evento publicado" y el evento en la lista

Esquema del escenario: el back rechaza el evento
  Dado que completé el formulario
  Cuando toco "Publicar evento" y el back responde 422 "<mensaje>"
  Entonces veo "<mensaje>" sobre "Publicar evento" y sigo con todo lo cargado

  Ejemplos:
    | mensaje                                    |
    | La fecha del evento tiene que ser futura   |
    | Ya hay un tipo de entrada llamado General  |

Escenario: las categorías no cargan
  Dado que GET /categorias falla
  Cuando abro "Nuevo evento"
  Entonces veo el error junto a "Categoría" y "Reintentar" vuelve a pedirlas
```

6 escenarios.

## Plan de tests

| Nivel | Caso |
| --- | --- |
| Front (RNTL) `CrearEvento` | formulario inicial; completitud (cada campo faltante deshabilita); elegir categoría del `Menu`; fecha y hora con los modales (mock de `react-native-paper-dates` que expone `onConfirm`); agregar hasta 10 y quitar; body exacto con `trim`, números, `multimedia` con y sin imagen y sin `descripcion` vacía; doble toque un pedido (`promesaManual`); 422 y 400 con texto exacto sin perder lo cargado; `dismissTo` con `aviso`; error de categorías con reintento |
| Front (RNTL) `MisEventos` | FAB navega a `/eventos/nuevo` (también en vacío); Snackbar "Evento publicado" con `aviso=evento-creado` y limpieza del parámetro |
| Front (RNTL) hooks/api | `useAvisoDeRuta`; `crearEvento` en `recursosApi.test.js`; DetalleCompra sigue mostrando "¡Gracias por tu reseña!" |
| Front (RNTL) navegación | un comprador no entra a `/eventos/nuevo`; `eventos/nuevo` no choca con `eventos/[id]` |
| E2E (temporal, se borra) | Fénix publica un evento por la UI y lo ve en Mis eventos |

## Fuera de alcance

- Editar o borrar eventos (no están en la consigna).
- Subir imágenes desde el teléfono (se usa una URL) y más de una imagen.
- Validar en el front las reglas de R8 (las responde el back).
- Elegir zona horaria (se usa la del dispositivo).

## Notas de IA

- Preguntas a la IA, el usuario eligió las opciones recomendadas: fecha y hora con `react-native-paper-dates` (anda en Expo Go y en web, para Cypress); en el front solo completitud y las reglas de R8 en el back con su 422; al publicar vuelve a Mis eventos con el aviso "Evento publicado"; de 1 a 10 tipos y una sola imagen opcional.
- La IA agregó sin preguntar (revisable): FAB también en el estado vacío; textos "Nuevo evento", "Publicar evento", "Agregar tipo", "Evento publicado"; testIDs `evento-*`, `tipo-<i>-*`, `categoria-<id>`, `evento-error`, `mis-eventos-aviso`; extraer el aviso por parámetro de ruta de DetalleCompra a `useAvisoDeRuta`; hook `useFormularioEvento` y componente `TiposDeEntrada`; mandar `descripcion` del tipo solo si no está vacía.
- Implementación: `react-native-paper-dates` se mockea a mano en `frontend/__mocks__/react-native-paper-dates.js` (botones `modal-fecha-ok` y `modal-hora-ok` que confirman el 5/12/2026 a las 22:00), porque los modales reales no se pueden manejar en RNTL. La lógica de armado del body quedó en `armarEvento.js` (`estaCompleto`, `armarEvento`, `formularioVacio`, `tipoVacio`, `MAXIMO_TIPOS`) y el formulario en `useFormularioEvento` (expone `valores`).
- El test de "hasta 10 tipos" pasó de `CrearEvento.test.jsx` a `useFormularioEvento.test.js`: con diez grupos de inputs renderizados superaba el timeout de 5 s al correr en paralelo. La pantalla conserva el caso de agregar y quitar.
- Revisión de calidad (hallazgos 1-5, aplicados): (1) `components/ListaDeCompras` concentra lista, filtro y vacío que repetían MisCompras y ComprasDelEvento; (2) las tarjetas de disponibilidad pasan al encabezado de la lista en ComprasDelEvento; (3) `ListaPaginada` recibe `espacioInferior` y el tema exporta `ESPACIO_FAB` para que el FAB no tape el último evento; (4) `useFormularioEvento` agrupa los campos en `valores`; (5) `SelectorCategoria` muestra un indicador de carga mientras llegan las categorías.
- jscpd: tras la normalización de fin de línea (CRLF) aparecieron 2 clones entre pantallas de la spec 11 que antes no detectaba; se resolvieron con `ListaDeCompras` (hallazgo 1). Quedan 0 clones en el front y los 7 conocidos del back.
- Verificado: 312 tests front en verde, `npm run calidad` sin errores, Cypress temporal (Fénix publica un evento y lo ve en Mis eventos) 1/1 y borrado. Expo Go: pendiente del usuario (selectores de fecha y hora).
