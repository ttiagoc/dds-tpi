# Spec 26 — Chips de filtro que se ven deslizables, y listas

- **Estado:** implementada
- **Rama:** `feature/chips-y-listas`
- **Casos de uso:** CU1, CU2, CU3 (ver `planes/00-indice.md`)
- **Iteración:** It5c

## Contexto
Las filas de chips (estado de compra en Mis entradas y en Compras del evento; categorías en Explorar) se deslizan hacia la derecha, pero nada lo indica y el usuario no descubre los filtros que quedan ocultos. En Mis entradas el título está pegado a los chips. En Explorar se cargan 10 eventos por página y con el seed no se nota la paginación.

## Historias
- Como usuario, quiero darme cuenta de que hay más filtros a la derecha.
- Como comprador, quiero que Explorar cargue los eventos de a poco.

## Reglas de negocio
Ninguna.

## Contrato de API
Sin cambios. Explorar manda `limit=6` a `GET /eventos`.

## Pantallas
- **`ChipsFiltro`** (todas las filas de chips): mide el ancho visible y el del contenido. Si queda contenido a la derecha, muestra al final, sobre la fila, un botón redondo con chevron (superficie y borde, sin degradado para no sumar `expo-linear-gradient`) (`<prefijo>-mas`, `accessibilityLabel="Ver más filtros"`) que desplaza la fila. Al llegar al final, se oculta. Si todo entra, no se muestra.
- **Mis entradas**: el título y los chips quedan separados por `espaciado.md`. Se ajusta el encabezado que arma `ListaDeCompras`, así Compras del evento queda igual.
- **Explorar**: 6 eventos por página. `useListaPaginada(pedir, criterio, { porPagina })` mantiene 10 por defecto para el resto de las pantallas.

## Criterios de aceptación
```gherkin
Escenario: hay más filtros a la derecha
  Dado que estoy en Mis entradas en un celular angosto
  Entonces veo un chevron al final de la fila de estados
  Cuando lo toco
  Entonces la fila avanza y, al llegar al final, el chevron desaparece

Escenario: todo entra
  Dado que la fila de chips entra completa
  Entonces no se muestra el chevron

Escenario: Explorar pagina de a 6
  Dado que hay más de 6 eventos próximos
  Cuando abro Explorar
  Entonces veo 6 y al bajar se cargan los siguientes
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front (RNTL) | `ChipsFiltro`: con `layout`/`contentSizeChange` simulados muestra el chevron, tocarlo llama a `scrollTo`, con `scroll` al final se oculta; si todo entra no aparece. Explorar pide `limit: 6`. `useListaPaginada` respeta `porPagina` |
| Manual | Expo Go: Mis entradas, Compras del evento y Explorar |

## Fuera de alcance
- Cambiar la paginación de otras pantallas.

## Notas de IA
La IA propuso un degradado más un chevron tocable (no solo decorativo), para que también sirva con lector de pantalla. Al implementar quedó solo el botón: el degradado pedía una dependencia nueva.
