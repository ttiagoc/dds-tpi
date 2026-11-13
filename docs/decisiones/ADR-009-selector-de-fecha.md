# ADR-009 — Selector de fecha y hora con react-native-paper-dates

- **Fecha:** 2026-11-11
- **Estado:** aceptada

## Contexto
Crear evento (CU4, spec 11b) necesita elegir día y hora. React Native Paper no trae un selector de fechas, y la pantalla tiene que andar en Expo Go y en Expo Web, porque Cypress corre sobre la web (ADR-006).

## Opciones
1. **`react-native-paper-dates`** (`DatePickerModal` + `TimePickerModal`): estilo MD3 coherente con Paper (ADR-002), solo JavaScript (anda en Expo Go y en web), traducción al castellano. Contra: una dependencia más.
2. **Dos `TextInput` con formato** ("DD/MM/AAAA" y "HH:MM"): sin dependencias. Contra: peor experiencia en el celular y validación de formato a mano.
3. **`@react-native-community/datetimepicker`**: selector nativo. Contra: no funciona en web, así que Cypress no podría cubrir el flujo.

## Decisión
`react-native-paper-dates`, instalado con `npx expo install`. Se registra la traducción `es` y la hora se elige en formato de 24 h. El día y la hora se combinan en la hora local del dispositivo y se mandan al back en ISO UTC.

## Consecuencias
- La librería publica ESM que Jest no transforma: en los tests se usa un mock manual en `frontend/__mocks__/react-native-paper-dates.js` (se aplica solo), cuyos modales confirman un día y una hora fijos.
- Si Paper llegara a sumar un selector propio, se puede reemplazar sin tocar el resto del formulario: todo el uso está en `SelectorFechaHora`.

## Rol de la IA
La IA presentó las tres opciones y recomendó la primera por compatibilidad con Expo Go, web y el sistema de diseño; el usuario la aceptó. La necesidad del mock manual surgió al correr la suite de navegación.
