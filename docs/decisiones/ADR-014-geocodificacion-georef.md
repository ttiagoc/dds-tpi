# ADR-014 — Geocodificar la dirección del evento con Georef

- **Fecha:** 2026-11-21
- **Estado:** aceptada

## Contexto

Se quiere un botón "Cómo llegar" que abra Google Maps con la ruta al evento. El evento solo tenía `lugar` (texto libre), y con eso Maps puede no encontrar el lugar o encontrar otro. En el TPA de DSI (DonaTrack) se resolvió algo parecido con la API Georef del Estado argentino.

## Opciones

1. **Dirección en texto**: un campo "Calle y número, localidad, provincia", y Maps busca ese texto. Sin dependencias, pero no se valida que la dirección exista.
2. **Georef + coordenadas**: el back geocodifica la dirección al crear el evento, guarda latitud y longitud y rechaza direcciones que no encuentra. Maps abre la ruta con coordenadas exactas.
3. **Google Geocoding API**: preciso, pero exige clave, facturación y un secreto en `.env`.

## Decisión

Opción 2. Georef es gratis, no necesita clave y está pensada para direcciones argentinas. La lógica de consultas (de la más precisa a la más amplia) se porta de `GeorefGeocodificador` de DonaTrack.

Se hace en el back, en un `GeorefGeocodificador` que se inyecta en `EventoService` (DI por constructor, como los repositorios). Así los tests usan un geocodificador falso y no salen a la red.

Si Georef no responde (timeout de 5 s o error de red), el evento se crea igual con `ubicacion: null` y "Cómo llegar" busca por el texto de la dirección: la demo no depende de un servicio externo. Si Georef responde que no encuentra la dirección, se rechaza con 422.

## Consecuencias

- Hay una dependencia externa en `POST /eventos`, acotada por el timeout y el plan B.
- El seed trae coordenadas ya calculadas y no llama a Georef al arrancar.
- `GEOREF_URL` es configurable (por defecto la URL pública).

## Rol de la IA

La IA presentó las opciones 1 y 2, con sus costos, y propuso el plan B ante una caída de Georef. El usuario eligió Georef con coordenadas, como en DonaTrack.
