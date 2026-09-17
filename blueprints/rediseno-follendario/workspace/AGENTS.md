# AGENTS.md — Follendario

App Angular 19 + Ionic 8 + Firebase para llevar la cuenta con amigos (antes SexControl). Está en mitad de un rediseño **solo visual** guiado por `blueprints/rediseno-follendario/` (`tasks.json` + `epics/*.md`).

## Comandos

- `npm test` — pruebas unitarias
- `npm run build -- --configuration production` — build a `www/`
- `node tests/ci/build-smoke.js` — humo de la build
- `node tests/design/<nombre>.check.js` — comprobaciones del diseño

## Lo que más importa

1. No cambies lógica ni datos: ninguna lectura o escritura nueva de Firestore.
2. En el tema nuevo `primary` es rosa y `secondary` cian (al revés que antes): no uses `color="secondary|tertiary|warning|light"`; usa las clases `f-key`, `f-badge`, `f-num-c/s`.
3. Conserva las clases y textos que usan los E2E (lista en `CLAUDE.md`, regla 3).

`CLAUDE.md` es la fuente de verdad; este archivo es solo el resumen.
