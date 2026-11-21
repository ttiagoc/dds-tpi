# Spec 28 — Dirección geocodificada y "Cómo llegar"

- **Estado:** implementada
- **Rama:** `feature/como-llegar`
- **Casos de uso:** CU4, CU10 (ver `planes/00-indice.md`)
- **Iteración:** It5c
- **ADR:** ADR-014 (Georef)

## Contexto
El evento solo tiene `lugar` (texto libre, por ejemplo "Estadio River Plate"). Para ofrecer "Cómo llegar" con Google Maps hace falta una dirección precisa. Como en el TPA de DSI (DonaTrack, `GeorefGeocodificador`), se geocodifica con la API Georef del Estado argentino, que es gratis, no necesita clave y está pensada para direcciones argentinas.

## Historias
- Como organizador, quiero cargar la dirección del evento y que la app me avise si no la encuentra.
- Como comprador, quiero tocar "Cómo llegar" y que se abra Google Maps con la ruta al evento.

## Reglas de negocio
- **R13** `Evento.direccion`: obligatoria y con formato "Calle y número, localidad, provincia" (al menos dos partes separadas por coma; la primera con un número). Si no cumple: "La dirección tiene que ser 'Calle y número, localidad, provincia'".
- **R14** `Evento.ubicacion`: `{ latitud, longitud }` o `null`. Latitud entre -90 y 90 y longitud entre -180 y 180; si no: "La ubicación del evento no es válida".
- **R15** Al crear, el back geocodifica la dirección. Si Georef no la encuentra → 422 "No encontramos esa dirección", con `details` en `direccion`. Si Georef no responde (timeout de 5 s o error de red) → el evento se crea con `ubicacion: null` y se deja un log. La publicación no se bloquea por un servicio externo.
- `lugar` queda como el nombre del sitio (sin cambios).

Geocodificación (port de DonaTrack): con la dirección partida por comas, se prueban consultas a `GET https://apis.datos.gob.ar/georef/api/direcciones?direccion=<calle>&max=5`, de la más precisa a la más amplia. La primera que trae coordenadas gana.
- Con 2 partes: `provincia`, `localidad` y `departamento` con la segunda parte.
- Con 3 o más partes: `provincia` + `localidad`, `provincia` + `departamento`, y solo `provincia`.

## Contrato de API
- `POST /eventos`: el body suma `direccion` (string, 5 a 200 caracteres). Errores nuevos: 400 si falta; 422 por R13 o R15.
- `EventoDetalle` suma `direccion` y `ubicacion: { latitud, longitud } | null`.
- Configuración: `GEOREF_URL` (por defecto `https://apis.datos.gob.ar/georef/api`) en `.env.example`.

## Pantallas
- **CrearEvento**: campo "Dirección" (`evento-direccion`) después de "Lugar", con ayuda "Calle y número, localidad, provincia". El front valida el formato (R13) al publicar (spec 23); el 422 de Georef se muestra en el campo.
- **DetalleEvento**: debajo de fecha y lugar se muestra la dirección y un botón "Cómo llegar" (`evento-como-llegar`) que abre con `Linking.openURL`:
  - con ubicación: `https://www.google.com/maps/dir/?api=1&destination=<latitud>,<longitud>`;
  - sin ubicación: `https://www.google.com/maps/search/?api=1&query=<direccion codificada>`.
- El seed carga direcciones reales con coordenadas ya calculadas (el seed no llama a Georef).

## Criterios de aceptación
```gherkin
Escenario: crear con dirección válida
  Dado que Georef ubica "Av. Figueroa Alcorta 7597, CABA, Buenos Aires"
  Cuando Fénix publica el evento
  Entonces responde 201 con direccion y ubicacion { latitud, longitud }

Escenario: dirección inexistente
  Dado que Georef no encuentra la dirección
  Cuando Fénix publica
  Entonces responde 422 "No encontramos esa dirección" con details en direccion

Escenario: Georef caído
  Dado que Georef no responde
  Cuando Fénix publica
  Entonces responde 201 con ubicacion null

Escenario: formato inválido
  Cuando la dirección es "Corrientes"
  Entonces responde 422 "La dirección tiene que ser 'Calle y número, localidad, provincia'"

Escenario: cómo llegar
  Dado un evento con ubicación
  Cuando toco "Cómo llegar"
  Entonces se abre Google Maps con destination=<lat>,<lng>
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit dominio | `Evento`: dirección requerida y con formato, ubicación válida o null, rangos |
| Unit geocodificador | `consultas()` con 2 y 3 partes; respuesta de Georef mockeada (`fetch` falso): encuentra, no encuentra, 4xx → sigue con la próxima consulta, timeout o red → "no disponible" |
| Unit service | `EventoService.crear`: guarda la ubicación; no encontrada → 422; no disponible → `ubicacion: null` |
| Integración | `POST /eventos` con geocodificador falso inyectado en el contenedor; detalle con `direccion` y `ubicacion` |
| Front (RNTL) | campo dirección y su error; "Cómo llegar" abre la URL correcta en los dos casos |
| Swagger | campos nuevos en `POST /eventos` y `EventoDetalle` |
| Manual | Expo Go: crear un evento con una dirección real y tocar "Cómo llegar" |

## Fuera de alcance
- Mapa embebido en la app y vista previa de la dirección antes de publicar.
- Editar eventos (no existe en el TP).

## Notas de IA
La IA presentó dos opciones: abrir Maps con el texto de la dirección, o geocodificar con Georef como en DonaTrack. El usuario eligió Georef con coordenadas. La IA agregó el plan B: si Georef no responde se publica igual, sin coordenadas, y el botón busca por texto.
