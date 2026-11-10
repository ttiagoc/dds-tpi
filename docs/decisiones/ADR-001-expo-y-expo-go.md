# ADR-001 — React Native con Expo y Expo Go

- **Fecha:** 2026-11-10
- **Estado:** aceptada

## Contexto
La consigna pide front en React Native ejecutándose localmente en un dispositivo mobile. Plazo ~3 semanas, sin experiencia previa en RN, Windows.

## Opciones
1. **Expo + Expo Go** — sin Android Studio, se prueba en el celular por QR, soporta web (react-native-web) → habilita Cypress. Limitado a módulos incluidos en Expo Go.
2. Expo + emulador — mismo código, emulador pesado en la PC.
3. React Native CLI — control total, setup largo (SDK Android, Gradle), sin web.

## Decisión
Expo (SDK estable más reciente, template JS) + expo-router, probado en Expo Go. Emulador o web como respaldo para grabar.

## Consecuencias
- Solo librerías compatibles con Expo Go (Paper, socket.io-client, secure-store lo son).
- El celular necesita la IP LAN del back (`EXPO_PUBLIC_API_URL`).
- La misma app corre en web → e2e con Cypress (ADR-006).

## Rol de la IA
Propuso Expo Go como opción más simple; se aceptó. Se agregaron las skills oficiales de Expo para que la IA no use APIs desactualizadas.
