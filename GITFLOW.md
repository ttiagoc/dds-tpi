# Git flow

Repo individual, sin remoto obligatorio: ramas locales y merges locales.

## Ramas

| Rama | Uso |
|---|---|
| `main` | Lo entregable. Solo recibe merges de `develop` al cerrar una iteración (con tag `itN`). |
| `develop` | Integración. Nunca se commitea directo salvo docs chicos. |
| `feature/<nombre>` | Feature nueva, sale de `develop`. Ej: `feature/busqueda-eventos`. |
| `fix/<nombre>` | Corrección. |
| `docs/<nombre>` | Planes, specs, ADRs. |
| `chore/<nombre>` | Configuración, dependencias, tooling. |

## Ciclo de una feature

```bash
git checkout develop
git checkout -b feature/compras-estados
# … spec → tests → código → cerrar-feature …
git checkout develop
git merge --no-ff feature/compras-estados -m "Mergea feature/compras-estados"
git branch -d feature/compras-estados
```

`--no-ff` deja visible en el historial cada feature (sirve como evidencia del proceso).

## Cierre de iteración

```bash
git checkout main
git merge --no-ff develop -m "Cierra iteración N"
git tag itN
git checkout develop
```

## Commits

- Una línea, castellano, tercera persona presente: "Agrega cancelación de compras con reembolso".
- Un commit = un cambio coherente. Sin `console.log` ni código comentado.
- Antes de commitear: tests y lint en verde.
