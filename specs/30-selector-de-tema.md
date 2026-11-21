# Spec 30 — Elegir tema claro, oscuro o automático

- **Estado:** implementada
- **Rama:** `feature/selector-de-tema`
- **Casos de uso:** — (preferencia de la app)
- **Iteración:** It5c
- **Depende de:** spec 19 (identidad visual, ADR-012)

## Contexto
La app sigue el modo del celular. Con el iPhone en modo oscuro, el usuario ve un fondo negro y no el diseño claro de las maquetas aprobadas (fondo `#FAFAF7`). Prefiere elegir el tema desde la app.

## Historias
- Como usuario, quiero elegir en Perfil si la app se ve clara, oscura o como el celular.

## Reglas
- **RT1** Opciones: Claro, Oscuro y Automático (sigue al celular). **Por defecto, Claro**: es el diseño de las maquetas.
- **RT2** La elección se guarda en el dispositivo (SecureStore en el celular, `localStorage` en la web, igual que la sesión) y no depende del usuario logueado: también se aplica en el login.
- Sin cambios en el back.

## Pantallas
- **Perfil** (comprador `perfil`, organizador `cuenta`): sección "Apariencia" con `SegmentedButtons` Claro / Oscuro / Automático (`tema-claro`, `tema-oscuro`, `tema-automatico`). El cambio se aplica en el momento.
- `PreferenciaTemaProvider` (`src/tema/`): lee la preferencia al arrancar (mientras tanto se usa la clara) y expone `{ preferencia, elegir }`. `app/_layout.jsx` elige `temaClaro` o `temaOscuro` (y su tema de navegación) según la preferencia y `useColorScheme()`.

## Criterios de aceptación
```gherkin
Escenario: por defecto claro
  Dado un celular en modo oscuro y sin preferencia guardada
  Cuando abro la app
  Entonces se ve con el tema claro

Escenario: elegir oscuro
  Cuando en Perfil elijo Oscuro
  Entonces la app pasa a oscuro y al reabrirla sigue en oscuro

Escenario: automático
  Dado que elegí Automático
  Entonces la app usa el modo del celular
```

## Plan de tests
| Nivel | Caso |
|---|---|
| Front unit | `temaPara(preferencia, esquema)` en los 3 casos; lectura y escritura de la preferencia (SecureStore mockeado y web) |
| Front (RNTL) | Perfil muestra la preferencia y al tocar otra la guarda y cambia el tema (`useTheme().dark`); con un valor guardado inválido usa Claro |
| Manual | iPhone en modo oscuro: se ve claro; elegir Oscuro y reabrir |

## Fuera de alcance
- Guardar la preferencia en el back o por usuario.

## Notas de IA
La IA explicó que el fondo negro venía del modo oscuro del celular y no de un cambio de diseño. El usuario eligió agregar un selector en Perfil; la IA propuso que por defecto se vea en claro, como las maquetas.
