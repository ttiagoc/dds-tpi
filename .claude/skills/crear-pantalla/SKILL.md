---
name: crear-pantalla
description: Usar al crear o completar una pantalla de la app Expo de AI Ticket It (React Native + React Native Paper + expo-router). Asegura estados de carga/error/vacío, accesibilidad, testIDs para Cypress, llamadas vía src/api y test con React Native Testing Library. Adaptación a mobile de la skill crear-pantalla del TP grupal.
---

# Crear pantalla

Responder en castellano rioplatense. Código sin comentarios obvios, nombres en castellano. Al terminar, recorrer `checklist.md`.

## 1. Entender la pantalla

- Buscarla en `planes/04-frontend-pantallas.md` (ruta, CU, contenido, endpoints, testIDs) y en la spec activa.
- Leer el contrato de cada endpoint en `planes/03-api-contratos.md`. **Si falta o no coincide: frenar y avisar.** Nunca inventar la forma de una respuesta.
- Revisar qué existe para reutilizar: `src/components/`, `src/api/`, `src/hooks/`.
- Si hace falta un componente visual nuevo o un color nuevo → skill `sistema-diseno`.

## 2. Proponer y esperar OK

Plan corto: ruta del archivo en `src/app/`, funciones de API (`src/api/<recurso>Api.js`), componentes nuevos/reutilizados, estados, testIDs, tests.

## 3. Implementar

### API
- Nunca `axios`/`fetch` en la pantalla. Funciones en `src/api/<recurso>Api.js` usando `cliente` y devolviendo `data`.
- Errores al usuario con `mensajeDeError(error)`.

### Sesión
- Usuario desde `useAuth()`. Nunca ids del usuario desde params.
- Decidir qué mostrar con `compra.acciones` que manda el back; no reimplementar reglas de negocio en el front.

### UI (React Native Paper)
- Solo componentes de Paper (`Text`, `Button`, `Card`, `TextInput`, `Chip`, `Searchbar`, `Dialog`, `Snackbar`, `SegmentedButtons`, `FAB`, `List`, `ActivityIndicator`, `HelperText`, `ProgressBar`, `Menu`, `IconButton`) + `View`/`ScrollView`/`FlatList` de RN para layout.
- Colores con `useTheme()` o tokens de `src/tema/`. **Sin hex** ni tamaños mágicos: espaciado desde `src/tema/espaciado.js`.
- `Text` con `variant` (`headlineSmall` para el título de pantalla, `titleMedium`, `bodyMedium`...).
- Envolver en `<Pantalla>` (safe area + ancho máximo en web).
- Listas con `FlatList` (no `map` dentro de `ScrollView`), `keyExtractor` con id, pull-to-refresh cuando hay datos remotos.

### Estados obligatorios
| Estado | Mostrar |
|---|---|
| Cargando | `<Cargando />` |
| Error | `<ErrorCarga mensaje onReintentar />` y deja de cargar |
| Vacío | `<EstadoVacio texto />` |
| Enviando | `Button loading disabled` |
| Éxito | `Snackbar` o `router.replace(...)`; nunca `alert()` |
| 403/404 | mensaje específico + volver |

### Formularios
- `TextInput mode="outlined"` con `label`, `keyboardType`/`secureTextEntry` correctos, `autoCapitalize` según el campo.
- Validación local antes de enviar; errores con `HelperText type="error"` debajo del campo.
- Errores 400/409/422 del back se muestran sin borrar lo escrito.
- Acciones destructivas (cancelar compra) con `Dialog` de confirmación.

### Accesibilidad y testeo
- `testID` en todo lo interactivo y en lo que Cypress verifica (ver `planes/04`). Formato kebab-case: `compra-cancelar`, `tarjeta-evento-3`.
- `accessibilityLabel` en `IconButton` y en imágenes.
- Área táctil ≥ 44 px. No depender solo del color (estado = color + ícono + texto).

### Tamaño
Partir en componentes si la pantalla pasa ~150 líneas, si algo se repite o tiene estado propio. Compartido → `src/components/`; propio → junto a la pantalla en `src/pantallas/<nombre>/` (las rutas de `src/app/` quedan finas y solo importan).

## 4. Tests

`<Pantalla>.test.jsx` junto al componente:
- `jest.mock("../../api/<recurso>Api")`.
- `renderConProviders(<Pantalla />, { usuario })`.
- Consultas por rol/texto/label; `getByTestId` solo si no hay alternativa.
- Mínimo: muestra los datos, muestra el error del back, la acción principal llama a la API con los argumentos correctos.

## 5. Verificar

```bash
cd frontend && npm test
npx expo start            # probar en Expo Go (celular)
npx expo start --web      # probar en web a 375 px
```

Usuarios seed con contraseña `Demo1234!` (ver `planes/03`). Recorrer `checklist.md`.

## 6. Cerrar

Resumen de lo hecho, qué no se pudo verificar, sugerencia de commit ("Agrega pantalla de mis compras"). No commitear sin pedido. Después usar `cerrar-feature`.
