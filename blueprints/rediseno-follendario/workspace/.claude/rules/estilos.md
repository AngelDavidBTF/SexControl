---
paths:
  - "src/**/*.scss"
  - "src/app/**/*.component.ts"
  - "src/app/**/*.modal.ts"
  - "src/app/**/*.page.ts"
---

# Estilos de Follendario

- Colores, fondos, bordes y sombras solo con tokens `--f-*` de `src/theme/_tokens.scss`. Ningún hexadecimal ni `--ion-color-*` en `.scss` de páginas ni en `styles` en línea (excepción: el fondo blanco del QR para que se pueda escanear).
- Antes de escribir una regla, busca la clase global en `src/theme/_componentes.scss` (`f-card`, `f-key`, `f-btn`, `f-ghost`, `f-badge`, `f-console`, `f-line`, `f-section`, `f-label`, `f-paper`, `f-legend`, `f-big`, `f-mid`, `f-num-c`, `f-num-s`).
- Cada `.scss` de página pesa menos de 4000 bytes.
- Variaciones por piel con `:host-context(body.dark)`, `:host-context(body.discreto)` o `:host-context(body.neutro)`; nunca comprobando el tema en TypeScript.
- Animaciones solo con `transform` y `opacity`, duración < 300 ms en interfaz, y nada que no se apague con `prefers-reduced-motion` (lo hace `_movimiento.scss`).
- Componentes de Ionic: solo variables CSS y `::part`. Si una regla global no aplica, suele ser porque la propiedad llega como propiedad y no como atributo: usa la clase que Ionic pone en el host (p. ej. `input-fill-outline`).
