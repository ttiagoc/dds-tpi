# Spec 24 — El teclado no tapa los campos y el numérico se puede cerrar

- **Estado:** implementada
- **Rama:** `fix/teclado-formularios`
- **Casos de uso:** CU4, CU5, CU6, CU9 (ver `planes/00-indice.md`)
- **Iteración:** It5c
- **Depende de:** spec 23

## Contexto
En iOS, el teclado numérico (precio y cupo) no tiene tecla de confirmar, así que no se puede cerrar. Además, cuando el campo está al final de la pantalla (la descripción en Nuevo evento), el teclado lo tapa y no se ve lo que se escribe.

## Historias
- Como usuario, quiero ver siempre el campo en el que escribo, aunque esté al final de la pantalla.
- Como organizador, quiero cerrar el teclado numérico cuando termino de escribir el precio o el cupo.

## Reglas de negocio
Ninguna.

## Contrato de API
Sin cambios.

## Pantallas
- **`Pantalla` con `scroll`**: el contenido se adapta al teclado. En iOS usa `automaticallyAdjustKeyboardInsets` del `ScrollView` (sin `KeyboardAvoidingView`, para no calcular el alto del encabezado); en Android, con edge-to-edge, un `KeyboardAvoidingView` con `behavior="height"`. En los dos, `keyboardDismissMode="interactive"`. Así el campo enfocado sube y el teclado se puede bajar deslizando. Aplica a todas las pantallas con scroll: Login, Nuevo evento, Reseñar.
- **`CampoNumero`** (`src/components/`): `TextInput` de Paper con `keyboardType` `number-pad` (enteros) o `decimal-pad` (precio), `returnKeyType="done"`, y en iOS un `InputAccessoryView` con un botón "Listo" (`<testID>-listo`) que cierra el teclado. Lo usan precio y cupo en `TiposDeEntrada`.
- **Chat**: se verifica que el redactor quede arriba del teclado (ya usa `KeyboardAvoidingView`).
- Comprar no tiene inputs de texto (usa `SelectorCantidad`).

## Criterios de aceptación
```gherkin
Escenario: cerrar el teclado numérico
  Dado que estoy escribiendo el precio de un tipo en iOS
  Cuando toco "Listo" arriba del teclado
  Entonces el teclado se cierra

Escenario: la descripción queda a la vista
  Dado que estoy en Nuevo evento
  Cuando enfoco la descripción
  Entonces la pantalla sube y veo lo que escribo arriba del teclado

Escenario: reseña larga
  Dado que estoy en Reseñar
  Cuando escribo el comentario
  Entonces el campo y el botón Enviar no quedan tapados
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front (RNTL) | `CampoNumero`: teclado según el tipo, "Listo" llama a `Keyboard.dismiss`, propaga `onChangeText` y el error; `Pantalla` con scroll arma el `KeyboardAvoidingView` y las props del `ScrollView` |
| Manual | Expo Go iOS: precio, cupo, descripción, reseña, login y chat |

## Fuera de alcance
- Librerías externas de teclado (`react-native-keyboard-controller`): se usa lo que trae React Native para no salir de Expo Go.

## Notas de IA
La IA revisó todas las pantallas con inputs: Comprar no tiene campos de texto y el chat ya maneja el teclado. Por eso concentró el arreglo en `Pantalla`, que cubre todas las pantallas con scroll de una vez.
