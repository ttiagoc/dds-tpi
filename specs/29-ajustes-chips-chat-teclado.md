# Spec 29 — Chips con flechas visibles, encabezado propio del chat y teclado numérico

- **Estado:** aprobada
- **Rama:** `fix/ajustes-chips-chat-teclado`
- **Casos de uso:** CU1, CU3, CU4, CU5, CU6
- **Iteración:** It5c
- **Corrige:** specs 24, 26 y 27 (prueba en el iPhone del 21/11)

## Contexto
En la prueba en el iPhone (iOS 26, Expo Go, modo oscuro) aparecieron tres problemas:
- **Chips:** el botón con chevron de la spec 26 es chico y tiene el mismo color que el fondo, así que no se distingue. Además no hay flecha para volver hacia la izquierda.
- **Chat:** el encabezado de la spec 27 queda debajo de la barra nativa de iOS 26: "< Compra" tapa el nombre de la contraparte. El margen seguro superior solo cuenta la barra de estado, no la de navegación, y Expo Router 58 no expone el alto del encabezado.
- **Teclado numérico:** la barra "Listo" de la spec 24 (`InputAccessoryView`) no aparece sobre el teclado de iOS.

## Pantallas
- **`ChipsFiltro`:** flechas a los dos lados, cada una con su condición:
  - a la derecha (`<prefijo>-mas`, "Ver más filtros") si queda contenido a la derecha;
  - a la izquierda (`<prefijo>-menos`, "Ver filtros anteriores") si la fila está desplazada.
  - Cada flecha es un botón redondo de 36 px, relleno con el color del chip elegido (tinta `onSurface`, ícono `surface`), así contrasta en modo claro y oscuro. Tocarla desplaza la fila un 70 % del ancho visible.
- **Chat:** la ruta `compras/[id]/chat` deja de usar el encabezado nativo (`headerShown: false`). `EncabezadoChat` suma un botón de volver (`chat-volver`, `accessibilityLabel="Volver"`, `router.back()`) a la izquierda del nombre, como las pestañas, que ya usan encabezado propio. `Pantalla` lleva `bordes={["top", "bottom"]}`: sin barra nativa, el margen seguro es el de la barra de estado y alcanza.
- **`CampoNumero`:** en iOS usa `keyboardType="numbers-and-punctuation"`, que trae tecla de confirmar (con `returnKeyType="done"` muestra "Listo" y cierra el teclado), en vez de `InputAccessoryView`. En Android sigue `number-pad`/`decimal-pad`, que ya tienen tecla de confirmar. Tocar fuera del campo también cierra el teclado (`keyboardShouldPersistTaps="handled"` en `Pantalla`).

## Criterios de aceptación
```gherkin
Escenario: flechas de los chips
  Dado que la fila de estados no entra en la pantalla
  Entonces veo la flecha derecha bien contrastada
  Cuando la toco
  Entonces la fila avanza y aparece la flecha izquierda
  Y al llegar al final desaparece la derecha

Escenario: chat sin superposición
  Dado que abro el chat de una compra en iOS 26
  Entonces veo el botón Volver, el nombre de la contraparte y el estado, sin nada encima
  Cuando toco Volver
  Entonces vuelvo a la compra

Escenario: cerrar el teclado numérico
  Dado que escribo el cupo en iOS
  Cuando toco "Listo" en el teclado
  Entonces el teclado se cierra
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front (RNTL) | `ChipsFiltro`: flecha derecha e izquierda según el desplazamiento, etiquetas accesibles, color de relleno distinto del fondo; `CampoNumero`: `numbers-and-punctuation` en iOS y `decimal-pad` en Android (`Platform.OS` mockeado); Chat: `chat-volver` llama a `router.back()` |
| Manual | iPhone en claro y oscuro: chips, chat y teclado |

## Fuera de alcance
- Cambiar la navegación de otras pantallas del stack (Evento, Compra y Comprar ya usan scroll con `contentInsetAdjustmentBehavior`).

## Notas de IA
En la spec 27 la IA supuso que el margen seguro superior incluía la barra de navegación translúcida; la prueba en el dispositivo mostró que no. Tampoco se pudo verificar `InputAccessoryView` antes de la prueba. Para las dos cosas se eligieron soluciones que no dependen de comportamientos de iOS que no se pueden probar en los tests.
