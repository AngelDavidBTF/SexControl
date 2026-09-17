---
paths:
  - "src/app/**/*.html"
  - "src/app/**/*.ts"
---

# Plantillas de Follendario

- Sin `color="secondary"`, `color="tertiary"`, `color="warning"` ni `color="light"`: en el tema nuevo `secondary` es cian. Usa `f-key pink|solo|neutral`, `f-badge c|s|t`, `f-num-c|s`.
- Conserva todas las clases, `(click)`, `*ngIf`, `trackBy` y `[dato]` existentes; las usan los E2E (`tests/e2e/`) y las comprobaciones (`tests/design/`).
- Números sensibles con `dato`. Etiquetas con variante discreta: «compañía/solitario» → «con alguien/por mi cuenta».
- Segmentos `mode="ios"`; campos `fill="outline"` con `label` y `labelPlacement="stacked"`; filas `ion-item class="f-row"`.
- Imágenes con `width`, `height` y `alt` (vacío si son decorativas); el nombre de la marca con `translate="no"`.
- Botones de solo icono con `aria-label`. Estados que cambian solos (PIN, detalle de un día) en un elemento `aria-live="polite"`.
- Textos nuevos en segunda persona y tono pícaro («¿Se te olvidó apuntar una?»), puntos suspensivos `…` en marcadores de posición.
- En `.ts` solo cambian `imports` y helpers de presentación que pida la tarea. Ninguna llamada nueva a Firestore.
