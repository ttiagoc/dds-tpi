# Spec 27 — Chat con encabezado fijo y mensajes anteriores al scrollear

- **Estado:** implementada
- **Rama:** `fix/chat-encabezado-fijo`
- **Casos de uso:** CU5, CU6 (ver `planes/00-indice.md`)
- **Iteración:** It5c
- **Depende de:** spec 12 (chat), spec 18 (paginación con `antesDe`)

## Contexto
Al entrar a un chat, la pantalla "se mueve para abajo". El encabezado (con quién hablo, el evento) está dentro de la lista, scrollea con los mensajes y la lista salta al final cada vez que cambia su contenido. Los mensajes anteriores solo se cargan con un botón. El back ya pagina (30 por página, cursor `antesDe`).

## Historias
- Como participante del chat, quiero que el encabezado quede fijo y que solo se muevan los mensajes.
- Como participante, quiero que al subir se carguen solos los mensajes anteriores, de a una página.

## Reglas de negocio
Sin cambios (R7, R11).

## Contrato de API
Sin cambios: `GET /compras/:id/mensajes?antesDe&limit` (30 por defecto).

## Pantallas
**Chat**:
- `EncabezadoChat` y el aviso "Sin conexión en vivo" (`chat-sin-conexion`) quedan **fuera** de la lista, fijos arriba. El redactor queda fijo abajo. `Pantalla` con `bordes={["top", "bottom"]}`: en iOS 26 el inset superior incluye el encabezado translúcido (spec 17), así que el encabezado fijo no queda tapado; donde el encabezado no es translúcido el inset es 0.
- Sin mensajes se muestra el vacío fuera de la lista (una lista invertida dibuja su `ListEmptyComponent` dado vuelta).
- `lista-mensajes` es una `FlatList` invertida: arranca mostrando el último mensaje, sin `scrollToEnd`, y un mensaje nuevo aparece abajo sin saltos. Los separadores de día se arman con el orden cronológico y después se invierten.
- Al acercarse al tope (`onEndReached`, umbral 0.3) se pide la página anterior, solo si hay más y no hay otro pedido en curso. Mientras carga, un spinner arriba (`chat-cargando-anteriores`).
- "Ver mensajes anteriores" (`chat-ver-anteriores`) queda como respaldo: aparece si hay más y es la vía para reintentar si falla (`chat-anteriores-error`).

## Criterios de aceptación
```gherkin
Escenario: encabezado fijo
  Dado un chat con muchos mensajes
  Cuando scrolleo hacia arriba
  Entonces el encabezado con la contraparte y el evento no se mueve

Escenario: cargar anteriores al subir
  Dado un chat con 45 mensajes (se ven los últimos 30)
  Cuando llego al tope
  Entonces se piden los mensajes con antesDe = id del más viejo y se ven los 45, sin saltar al final

Escenario: no pide de más
  Dado que ya cargué todo el historial
  Cuando vuelvo a llegar al tope
  Entonces no se hace otro pedido
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front unit | `conSeparadores` con el orden invertido |
| Front (RNTL) | el encabezado no está dentro de `lista-mensajes`; `onEndReached` pide con `antesDe` y no vuelve a pedir mientras carga ni si `hayMas` es false; el error muestra el botón de reintento; un mensaje nuevo aparece |
| E2E | el flujo de chat sigue andando |
| Manual | Expo Go: chat del seed con más de 30 mensajes |

## Fuera de alcance
- Cambiar el tamaño de página del back.

## Notas de IA
La IA identificó que el salto venía de `onContentSizeChange → scrollToEnd` combinado con el encabezado dentro de la lista, y propuso la lista invertida, que es el patrón habitual de los chats en React Native.
