# Deuda separada · Sprint polish atleta 2026-05-10

Sprint en branch `polish/atleta-audit-2026-05-10`. Cubrió copy (voseo → español MX), anti-patterns (`window.confirm` → `useConfirm`), locale es-MX explícito, hydration sweep en client components, y auditoría visual con Playwright en 15 rutas de `/atleta/*` a 360/768/1280.

Quedó fuera de scope deliberadamente. Atacar en sprints posteriores.

## 1. Tests E2E preexistentes con strict-mode violations

**Estado:** 11 fallos preexistentes documentados en CLAUDE.md. No es regresión de este sprint.

**Causa:** `getByText` ambiguo entre toast notifications y `<p>` en la misma página (Playwright strict mode rechaza selectores no-únicos).

**Recomendación:** sprint dedicado con `qa-polish`. Reemplazar `getByText` con `getByRole`/`getByTestId` específicos por contexto (`role="status"` para toasts, `role="dialog"` para modals).

## 2. Tests E2E del flujo crítico del atleta

**Estado:** 0 tests E2E que cubran el flujo del atleta. Toda la cobertura es unit/integration.

**Flujo crítico ideal a cubrir:**

1. Login dev → redirige a `/atleta`
2. Home muestra hero + próxima clase (si la hay) sin errores SSR
3. Reservar clase → aparece en home como "Tu próxima clase"
4. Cancelar reserva via modal `useConfirm()`
5. Crear WOD score → aparece en `/atleta/historial`
6. PR auto-detect: subir score mejor al anterior dispara toast PR

Cubierto manualmente con Playwright en este sprint (smoke test verde). Falta automatizarlo en `tests/e2e/atleta/*.spec.ts`.

## 3. Imágenes raw `<img>` en `/atleta/wod/foto/PhotoWodFlow.tsx`

**Estado:** ESLint warning preexistente — 2 ocurrencias (líneas 266, 349) usan `<img>` en vez de `next/image`.

**Por qué se queda:** las imágenes son uploads del usuario (foto del whiteboard) con URLs dinámicas presigned de S3. `next/image` requiere config de remote domains y degrada UX para previews ephemerals.

**Recomendación:** evaluar agregar `next.config.js` `images.remotePatterns` para el bucket S3 y migrar — o suprimir warning con comentario justificativo si decidimos quedarnos con `<img>`.

## 4. Banner "Instalar Kronos" siempre visible

**Estado:** El banner PWA aparece en cada pantalla del atleta hasta que el usuario lo descarta. Toma ~120px en mobile (notable en 360 px).

**Recomendación:** evaluar gate más estricto (`shouldShowInstallBanner` ya está ahí pero usa criterios laxos). Quizás ocultar hasta que el atleta tenga 5+ visitas y mostrarlo solo una vez por sesión.

## 5. Cambios sin commitear en `(landing)/atletas/**`

**Estado:** 12 archivos modificados + `PhoneFrame.tsx` untracked en el landing `/atletas` (manual visual). Viajan en el branch `polish/atleta-audit-2026-05-10` pero **no entran a estos commits**.

**Recomendación:** commit aparte con mensaje `polish(landing): /atletas — pulido visual del manual` cuando Samuel valide los cambios visualmente.

Archivos:

- `src/app/(landing)/_components/SectionAtleta.tsx`
- `src/app/(landing)/atletas/_components/{AtletaClosingCTA,AtletaForWho,AtletaHero,AtletaHits,AtletaManualPreview,AtletaSiNo,ManualHero,ManualScreen,PhoneFrame}.tsx`
- `src/app/(landing)/atletas/_data/screens.ts`
- `src/app/(landing)/atletas/layout.tsx`
- `src/app/(landing)/landing.css`

## 6. PRD coach virtual (`specs/PRD-coach-virtual.md`)

Archivo untracked. No tocado por este sprint, queda como feature futuro.

---

## Resumen del sprint (atleta visible al usuario)

| Categoría                             | Estado pre                  | Estado post                                  |
| ------------------------------------- | --------------------------- | -------------------------------------------- |
| Voseo argentino                       | 16+ ocurrencias UI + emails | 0                                            |
| Spanglish ("Loggeado")                | 3+ ocurrencias              | 0                                            |
| `window.confirm/alert`                | 2 ocurrencias               | 0 (todos via `useConfirm()`)                 |
| `toLocaleString()` sin locale         | 4 ocurrencias               | 0 (todos con `"es-MX"`)                      |
| Hydration risk `new Date()` en render | 2 candidatos                | 0 (patched con `useState(null) + useEffect`) |
| SSR error `/atleta` home              | 1 (preexistente)            | 0 (useConfirm SSR-safe)                      |
| Errores consola @ /atleta             | 1                           | 0                                            |

**Veredicto:** verde para merge a `main` tras smoke test manual de Samuel.
