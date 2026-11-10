# ADR-002 — React Native Paper como librería de UI

- **Fecha:** 2026-11-10
- **Estado:** aceptada

## Contexto
Hace falta una UI prolija y consistente rápido, en mobile y web, y que la IA genere bien.

## Opciones
1. **React Native Paper** (Material 3) — componentes completos, theming, funciona en web, muy documentada.
2. NativeWind — utilitario tipo Tailwind, setup frágil con Expo/babel.
3. StyleSheet propio — control total, mucho más trabajo y riesgo de inconsistencia.
4. Tamagui/gluestack — más nuevas, más riesgo de que la IA alucine APIs.

## Decisión
React Native Paper + tema propio (`src/tema/tema.js`) con tokens de color de estados de compra.

## Consecuencias
- Regla: solo componentes Paper (análogo a "solo MUI" del TP grupal); estilos desde el tema.
- Look Material; se personaliza con colores y tipografía.

## Rol de la IA
Recomendación aceptada; la skill `sistema-diseno` fija las reglas para que la IA no mezcle estilos.
