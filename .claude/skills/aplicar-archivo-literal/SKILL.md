---
name: aplicar-archivo-literal
description: Copia un archivo ya diseñado y probado desde blueprints/rediseno-follendario/archivos/ a su sitio en el repo, comprobando antes que el original no ha cambiado. Úsala cuando una tarea diga «cp blueprints/rediseno-follendario/archivos/…».
---

# Aplicar un archivo literal del plan

## When to use
- La sección de la tarea lista comandos `cp blueprints/rediseno-follendario/archivos/<ruta> <ruta>`.

## Steps
1. Si la tarea empieza con `git diff --quiet d788095 -- <archivo>`, ejecútalo. Sale con 0: sigue. Sale con 1: el archivo cambió después de escribirse el plan; **para y avisa** con la salida de `git diff d788095 -- <archivo>`.
2. Ejecuta los `cp` y `mkdir -p` en el orden de la tarea, desde la raíz del repo.
3. No retoques el archivo copiado (ni formato, ni comillas, ni comentarios): las comprobaciones y pruebas se escribieron contra ese contenido exacto.
4. Ejecuta el bloque Verify de la tarea.

## Verify
```bash
git diff --no-index --quiet blueprints/rediseno-follendario/archivos/<ruta> <ruta>   # expect: exit 0 (copia idéntica)
```

## Do not
- No copies encima de un archivo que ha cambiado desde d788095.
- No «mejores» el archivo copiado.
