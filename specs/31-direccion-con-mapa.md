# Spec 31 — Dirección por campos y confirmación en el mapa

- **Estado:** aprobada
- **Rama:** `feature/direccion-con-mapa`
- **Casos de uso:** CU4
- **Iteración:** It5c
- **Depende de:** spec 28 (Georef, ADR-014)

## Contexto
En la spec 28 la dirección se escribe en un solo campo con el formato "Calle y número, localidad, provincia", y el organizador recién se entera de un error al publicar. El usuario pide campos separados con ejemplos y ver la ubicación en un mapa para confirmarla antes de publicar.

## Historias
- Como organizador, quiero cargar la calle, el número, la localidad o barrio y la provincia por separado, con un ejemplo en cada campo.
- Como organizador, quiero tocar "Ver en el mapa", ver un pin donde la app ubicó la dirección y confirmar que es ahí.

## Reglas
Se mantienen R13 a R15 (`planes/02`). El back sigue geocodificando al crear: el mapa es una vista previa, no se confía en coordenadas que mande el cliente.

- **RD1** Campos: Calle (requerido), Número (requerido, entero positivo), Localidad o barrio (requerido) y Provincia, elegida de la lista de las 24 de Georef, con "Ciudad Autónoma de Buenos Aires" primero. El front arma `direccion = "<calle> <número>, <localidad>, <provincia>"`.
- **RD2** "Ver en el mapa" consulta la ubicación y muestra el mapa con un pin. Para publicar hay que tocar "Sí, es acá" (`ubicacion-confirmar`). Si se cambia algún campo después, la confirmación se pierde. Error al publicar sin confirmar: "Confirmá la ubicación en el mapa".
- **RD3** Si Georef no responde al buscar (503), se avisa "No pudimos mostrar el mapa. Podés publicar igual" y se permite publicar sin confirmar (coherente con R15).

## Contrato de API
| Método | Ruta | Auth | Query | Respuesta | Errores |
|---|---|---|---|---|---|
| GET | `/direcciones/ubicacion` | 🅞 | `calle` (1-100), `numero` (entero 1-99999), `localidad` (1-100), `provincia` (1-100) | 200 `{ direccion, latitud, longitud }` (`direccion` armada como en RD1) | 400, 401, 403, 422 "No encontramos esa dirección", 503 "No pudimos consultar el mapa, probá en un rato" |

`POST /eventos` no cambia: sigue recibiendo `direccion` como texto. Se suma el error 503 (`ServiceUnavailableError`) a `errors/`.

## Pantallas
- **CrearEvento → `CamposDireccion`**: "Calle" (placeholder "Ej.: Av. Corrientes"), "Número" (`CampoNumero`, "Ej.: 1234"), "Localidad o barrio" ("Ej.: Palermo") y "Provincia" (lista, `direccion-provincia`). Botón "Ver en el mapa" (`direccion-buscar`, con loading mientras busca). Los errores van en cada campo (spec 23).
- **`MapaUbicacion`**: `MapView` de `react-native-maps` (viene en Expo Go) de 180 px de alto, con un `Marker` en las coordenadas, sin interacción, más la dirección que devolvió Georef y el botón "Sí, es acá". Una vez confirmada se ve "Ubicación confirmada" con un ícono. En la web (`MapaUbicacion.web.jsx`) no hay mapa: se muestran la dirección y un enlace "Ver en Google Maps".
- testIDs: `direccion-calle`, `direccion-numero`, `direccion-localidad`, `direccion-provincia`, `direccion-buscar`, `ubicacion-mapa`, `ubicacion-confirmar`, `ubicacion-confirmada`, `direccion-error`.

## Criterios de aceptación
```gherkin
Escenario: confirmar en el mapa y publicar
  Dado que completé Calle "Sarmiento", Número 3131, Localidad "Balvanera", Provincia "Ciudad Autónoma de Buenos Aires"
  Cuando toco "Ver en el mapa"
  Entonces veo el mapa con el pin
  Cuando toco "Sí, es acá" y publico
  Entonces se envía direccion "Sarmiento 3131, Balvanera, Ciudad Autónoma de Buenos Aires"

Escenario: publicar sin confirmar
  Cuando publico sin haber confirmado
  Entonces veo "Confirmá la ubicación en el mapa" y el foco va al botón "Ver en el mapa"

Escenario: dirección inexistente
  Cuando busco una dirección que Georef no encuentra
  Entonces veo "No encontramos esa dirección" junto a los campos

Escenario: cambiar después de confirmar
  Dado que confirmé la ubicación
  Cuando cambio el número
  Entonces la confirmación se pierde y tengo que volver a buscar

Escenario: Georef caído al buscar
  Cuando la búsqueda responde 503
  Entonces veo el aviso y puedo publicar sin confirmar
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Unit validación | `ubicacionQueryValidation`: requeridos, número entero, largos |
| Unit service | `DireccionService.ubicar`: arma la dirección, encontrada → 200, null → 422, no disponible → 503 |
| Integración | `GET /direcciones/ubicacion` con el geocodificador falso: 200, 422, 503, 400, 401, 403 (comprador) |
| Front unit | `armarDireccion`, la validación de los campos y de la confirmación en `validarEvento` |
| Front (RNTL) | buscar muestra el mapa (`react-native-maps` mockeado), confirmar, cambiar un campo pierde la confirmación, 422 y 503, publicar arma la dirección |
| Swagger | endpoint nuevo |
| Manual | iPhone: buscar, ver el pin y publicar |

## Fuera de alcance
- Mover el pin a mano o tocar el mapa para elegir el lugar.
- Autocompletar calles mientras se escribe.

## Notas de IA
El usuario pidió campos separados, ejemplos en los placeholders y un mapa para confirmar. La IA propuso disparar la búsqueda con un botón para no consultar Georef en cada tecla, y el usuario lo eligió. La IA mantuvo que el back vuelva a geocodificar al publicar, en lugar de aceptar las coordenadas que manda el cliente.
