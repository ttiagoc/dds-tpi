# Spec 17 — Ajustes de la app en el celular

- **Estado:** aprobada
- **Rama:** `fix/ux-celular`
- **Casos de uso:** transversal (todas las pantallas); CU3 (Explorar)
- **Iteración:** It5 (post cierre, pruebas en Expo Go)
- **Depende de:** specs 09 a 16, ADR-002 (Paper), skill `sistema-diseno`

## Contexto

Primera prueba del usuario en un iPhone (iOS 26, Expo Go) con el back en la PC. Problemas encontrados y diagnosticados:

1. Las pantallas del stack (Evento, Compra, Comprar, etc.) arrancan **debajo** del encabezado translúcido de iOS 26: se tapa la parte de arriba y no se puede subir más. La documentación de Expo indica `contentInsetAdjustmentBehavior="automatic"` en el scroll de pantallas con encabezado nativo.
2. Los eventos no muestran imagen: el seed usa `picsum.photos`, que responde 522 (servicio externo caído). La app muestra el reemplazo, pero la demo depende de un tercero.
3. El teclado de la búsqueda cuesta cerrarlo: la lista no lo cierra al deslizar y "Buscar" no hace nada.
4. Avisos `WARN When setting overflow to hidden on Surface…` en consola, por `overflow: "hidden"` en la `Card` de `TarjetaEvento`.
5. La app no tiene logo ni sensación de inicio.

Decisiones del usuario: logo diseñado por la IA; Explorar con aire de home; registro de usuarios y notificaciones **fuera de alcance** (ningún CU los pide; ADR-004 ya dejaba el registro como mejora futura).

## Reglas de negocio

No agrega reglas.

## Contrato de API

- Nuevo recurso estático **`GET /imagenes/<archivo>`** (🔓): imágenes de los eventos del seed, servidas por el back desde `backend/public/imagenes`.
- `EventoResumen.imagen` / `EventoDetalle.multimedia`: además de URLs absolutas, pueden ser **rutas relativas al back** (`/imagenes/rock.jpg`). El front las resuelve contra `EXPO_PUBLIC_API_URL`. Actualizado en `planes/03-api-contratos.md`.

## Cambios

| # | Dónde | Cambio |
|---|---|---|
| 1 | `components/Pantalla`, `components/ListaPaginada`, pantallas sin scroll con encabezado | `contentInsetAdjustmentBehavior="automatic"` en `ScrollView`/`FlatList` |
| 2 | back `app.js`, `public/imagenes/*.jpg`, seed; front `utils/imagenes.js` (`urlDeImagen`), `ImagenEvento`; `Dockerfile` | Imágenes propias del seed (una por evento, generadas para el proyecto, sin licencias de terceros) servidas por Express; el front completa las rutas relativas |
| 3 | `ListaPaginada`, buscador de Explorar | `keyboardDismissMode="on-drag"`; el buscador con `returnKeyType="search"` cierra el teclado al confirmar |
| 4 | `TarjetaEvento` | El recorte va en un `View` interno, no en la `Card` |
| 5 | `components/Logo` (nuevo), encabezado de Explorar y Mis eventos, `assets/` (ícono, splash, favicon) | Logo: ícono de ticket + "AI Ticket It" en el primario del tema (claro y oscuro) |
| 6 | Explorar | Saludo "Hola, <nombre>" + "Encontrá tu próximo evento" y título de sección sobre la lista: "Próximos eventos" (orden por defecto), "Todos los eventos" (otro orden) o "Resultados" (con búsqueda o filtro) |

## Criterios de aceptación

```gherkin
Escenario: el contenido arranca debajo del encabezado
  Dado una pantalla del stack con encabezado en iOS
  Entonces su scroll ajusta el inset automáticamente y la parte de arriba se ve completa

Escenario: imágenes sin depender de internet
  Dado el back levantado
  Cuando se pide GET /imagenes/rock.jpg
  Entonces responde 200 con una imagen
  Y los eventos del seed la usan como imagen, que el front resuelve contra la URL del back

Escenario: cerrar el teclado de la búsqueda
  Cuando el usuario desliza la lista o toca "Buscar"
  Entonces el teclado se cierra

Escenario: Explorar como inicio
  Dado Ana sin búsqueda ni filtro
  Entonces ve el logo, "Hola, Ana" y el título "Próximos eventos"
  Cuando escribe en la búsqueda
  Entonces el título pasa a "Resultados"
```

## Plan de tests

| Nivel | Caso |
|---|---|
| Integración back | `GET /imagenes/<seed>` 200 `image/jpeg`; archivo inexistente 404; los eventos del seed tienen imagen `/imagenes/...` |
| Front (RNTL) | `Pantalla` y `ListaPaginada` con `contentInsetAdjustmentBehavior`; `urlDeImagen`; `ImagenEvento` con ruta relativa; buscador cierra el teclado; `Logo`; Explorar con saludo y Próximos, que se ocultan al buscar |
| E2E | 3/3 de regresión |
| Manual | iPhone (Expo Go): Evento y Compra sin contenido tapado; imágenes; teclado |

## Fuera de alcance

- Registro de usuarios (ADR-004) y notificaciones.
- Rediseño de navegación (tabs nativas de iOS 26).

## Notas de IA

- Cambio respecto de lo hablado: en vez de una fila horizontal de "Próximos eventos" (repetía los primeros de la lista, que ya se ordena por fecha, y sumaba un pedido al back) se usa un título de sección sobre la misma lista.
- Imágenes: 12 JPG de 800×450 (13 a 21 KB) generadas con Python/Pillow para el proyecto: color por categoría, ícono de Material Design Icons (Apache 2.0, ya incluido en el proyecto) y nombre del evento. Ícono de la app, favicon y adaptativos de Android generados igual (ticket blanco sobre el violeta `#8E2DA8`).
- `Login` y `Mensajes` (Chat) pasaron el máximo de 40 líneas por función al sumar cambios; se extrajeron `Marca`, `CabeceraDeMensajes` y `SinMensajesCargados` sin bajar el umbral. El test de Swagger exigía 400 a todo parámetro de ruta; se acotó a `{id}`/`{eventoId}`, como dice su nombre.
- Verificado: back 803, front 390, `npm run calidad` (7 clones del back), e2e 3/3, capturas web (logo, saludo, imágenes, chat con el evento dentro de la lista). El inset de iOS solo se puede comprobar en el iPhone.

- Los dos síntomas de diseño "cortado" (Evento y Compra) eran una sola causa: el encabezado translúcido de iOS 26; se confirmó en la referencia de Expo Router antes de cambiar código.
- La falta de imágenes no era un bug de la app: el servicio externo respondía 522.
