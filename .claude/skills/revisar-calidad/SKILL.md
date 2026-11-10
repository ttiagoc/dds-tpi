---
name: revisar-calidad
description: Usar al cerrar cualquier rama de AI Ticket It (antes de cerrar-feature), al revisar código ya mergeado, o cuando se sospecha código repetido, funciones largas, lógica en la capa equivocada o módulos que mezclan responsabilidades.
---

# Revisar calidad

Las métricas automáticas (`npm run calidad`) solo ven clones textuales y funciones grandes. La repetición conceptual (la misma regla en dos capas, clases que difieren en un literal) y el acoplamiento entre capas se detectan leyendo. Esta skill combina las dos cosas y **solo reporta**: no se cambia nada sin aprobación del usuario.

## 1. Métricas

```bash
npm run calidad      # eslint (complejidad ≤8, anidamiento ≤3, función ≤40 líneas, ≤4 params, ===) + jscpd (clones ≥40 tokens, umbral 3%)
```

Cada error que aparezca es un hallazgo. No se baja un umbral ni se agrega `eslint-disable` para que pase.

## 2. Lectura del diff

`git diff develop...HEAD --stat` y después leer cada archivo tocado completo, no solo las líneas cambiadas.

| Eje | Qué buscar | Ejemplo en este repo |
|---|---|---|
| Repetición | misma regla, validación o mensaje en ≥2 lugares | `puedeCancelar` recalculado en el service o en el front en vez de usar `compra.accionesPara` |
| Repetición | clases o funciones que solo difieren en un literal | subclases de error con el mismo constructor → tabla o fábrica |
| Repetición | el mismo armado de datos en ≥3 tests | pasarlo a `test/helpers/domainFactories.js` o `http.js`; casos tabulares con `it.each` |
| Capas (AGENTS.md) | `domain/` importa Express, repos o services, o llama a `new Date()` sin argumentos | |
| Capas | un controller con reglas de negocio o acceso directo a repos; un service que usa `req`/`res` | |
| Capas | una pantalla que llama a axios o usa un hex suelto | |
| Módulos | un archivo con dos responsabilidades; un helper que se usa en ≥2 archivos y vive escondido en uno de ellos | moverlo a `validations/` o `domain/validaciones.js` |
| Limpieza | código muerto, `console.log`, comentarios obvios, nombres fuera de la convención | |

**Contra la sobreingeniería:** dos apariciones triviales (de 1 o 2 líneas) no justifican una abstracción. Tampoco se agregan capas ni parámetros "por si acaso".

## 3. Reporte

Una tabla, de más grave a menos grave:

| # | Severidad | archivo:línea | Problema | Propuesta |
|---|---|---|---|---|

- **alta**: una regla duplicada que puede divergir, o una capa violada.
- **media**: duplicación en ≥3 lugares, o una función o archivo que mezcla responsabilidades.
- **baja**: nombres, limpieza, tests mejorables.

Si no hay hallazgos, decirlo y mostrar la salida de `npm run calidad`.

## 4. Aplicar

Solo lo que el usuario aprueba. Después de aplicar: `npm test` del módulo y `npm run calidad`, ambos en verde, con la salida a la vista. Lo encontrado se anota en la bitácora (`bitacora-ia`).

## Errores comunes

| Error | Corrección |
|---|---|
| Dar por buena la rama porque `npm run calidad` pasa | Las métricas no ven la repetición conceptual: el paso 2 es obligatorio |
| Refactorizar mientras se revisa | Primero el reporte, después la aprobación |
| Revisar solo las líneas del diff | La repetición suele estar entre el código nuevo y el viejo |
| Abstraer todo lo que se parece | Aplicar la regla de las ≥3 apariciones o de la regla que puede divergir |
