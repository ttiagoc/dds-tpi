# ADR-012 — Identidad visual "Minimal cálido"

- **Fecha:** 2026-11-19
- **Estado:** aceptada

## Contexto

La app usaba el tema MD3 de React Native Paper casi sin cambios (violeta, fuente del sistema, tarjetas con sombra). Funcionaba, pero no tenía identidad propia y varias pantallas daban el mismo peso a todas sus acciones. Los dos proyectos de referencia revisados (DonaTrack y el TP grupal) son web y comparten un verde institucional, así que copiarlos no daba una identidad propia.

## Opciones

1. **Boletería**: papel crema, tinta negra, acento coral, tarjetas con forma de entrada y tipografía condensada.
2. **Escenario nocturno**: oscuro por defecto con acento lima, fotos a todo el ancho.
3. **Minimal cálido**: neutros cálidos, un único acento naranja quemado, Manrope, tarjetas planas con borde fino y botones en píldora.

## Decisión

Opción 3, validada con maquetas de 8 pantallas antes de escribir código. Se mantiene React Native Paper (ADR-002): la identidad se aplica con sus tokens (`MD3LightTheme`/`MD3DarkTheme` extendidos, `configureFonts`) y los componentes compartidos, sin librería de estilos nueva. Toma de la opción 1 un solo rasgo, la tarjeta de compra con forma de entrada, porque representa el dominio.

## Consecuencias

- Nueva dependencia de fuentes (`@expo-google-fonts/manrope`, `expo-font`, `expo-splash-screen`); la app espera las fuentes antes de mostrarse.
- El acento se oscureció a `#BF4316` para cumplir 4.5:1 con texto blanco.
- Las reglas de diseño quedan en la skill `sistema-diseno` para que las pantallas nuevas las sigan.

## Rol de la IA

La IA relevó las referencias, propuso las tres direcciones y armó las maquetas; el usuario eligió la dirección y aprobó las maquetas. La IA corrigió el contraste del acento.
