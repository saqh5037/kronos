# Brief para Kimi · Pulido Visual Kronos Sprint 1+2+3

> **Para Kimi (lane visual)**: Claude cerró el backend de los 3 sprints de diferenciación competitiva. Este brief lista exactamente qué pulir, en qué orden, con qué efectos. Ya hay tokens, components base y micro-interactions establecidos — extiéndelos, no reinventes.

**Branch**: `main` · **Last Claude commit**: `62d9980` · **Tests**: 430/430 verde · **Backend**: cerrado.

---

## Lane discipline (estricto)

**TÚ haces**: CSS, animaciones, layout, micro-interactions, decoración, brand consistency, responsive polish.
**TÚ NO tocas**: `src/server/**`, `prisma/**`, `src/lib/validations/**`, server actions, tests. Si crees que necesitas tocar algo backend, **pausa y avisa a Samuel**.

**Archivos compartidos** (mixed lane — coordina antes):

- `src/app/**/page.tsx` — yo escribí la lógica, tú puedes refactorizar la presentación pero NO la data fetching.
- `src/components/**` — los componentes que YO creé son funcionales crudos. Tú los pules.

---

## Brand reference (NO redefinir)

Tokens en `src/app/globals.css`:

| Token                | Uso                                    |
| -------------------- | -------------------------------------- |
| `--bg #1a1d20`       | Fondo base                             |
| `--bg-soft #23272b`  | Sidebar, headers                       |
| `--card #2a2f33`     | Cards                                  |
| `--card-2 #34393e`   | Cards activas/elevated                 |
| `--recovery #19f08b` | Verde · success · PR · positive        |
| `--strain #3aa3ff`   | Azul · info · in-progress              |
| `--pr #ff5e5e`       | Rojo · alert · sensitive · destructive |
| `--grad`             | Gradiente azul→verde (CTAs primarios)  |
| `--grad-soft`        | Versión transparente                   |

Clases Tailwind custom: `k-card`, `k-eyebrow`, `k-btn-grad`, `k-btn-ghost`, `k-chip`, `k-chip-recovery/strain/pr/ghost`.

Fonts: `font-sans` Inter · `font-display` Space Grotesk · `font-mono` JetBrains Mono.

---

## Componentes de referencia (la barra de calidad)

Inspírate en estos — son lo más pulido del proyecto, **mantén ese nivel**:

- `src/components/kronos/HaloRing.tsx` — SVG anillos con glow + spring physics
- `src/components/kronos/Sparkline.tsx` — area + polyline con draw animation 600-1100ms
- `src/components/kronos/AnimatedStats.tsx` — stagger 3 HaloRings con spring
- `src/components/charts/Heatmap.tsx` — GitHub-style 7x52 SVG

Stack visual: **Framer Motion 11** (ya instalado), **gradientes CSS**, **drop-shadow glow**, micro-interactions con `whileHover`/`whileTap`.

---

## 🔥 Pages a pulir (prioridad ordenada)

### 🥇 P1 — `/admin/clases/[id]/scores-from-whiteboard/` (EL WOW MOMENT)

**Path**: `src/app/admin/clases/[id]/scores-from-whiteboard/_steps/Step1Upload.tsx`, `Step2Review.tsx`, `Step3Confirm.tsx`

Esta es **LA feature más vendible** de Kronos. La que demos al dueño piloto. Tiene que sentirse premium.

**Step 1 — Upload zone**:

- Estado actual: dropzone dashed border, emoji 📸 estático
- Pulir: drag-over states con border que pulsa en `--recovery`. En tap, ripple effect. Preview con scale-in spring.
- Idea premium: si está en mobile, primer load anima un device frame mostrando "tap aquí" con un finger icon que toca y desaparece (1 sola vez).

**Step 2 — Review table**:

- Estado actual: tabla cruda con dropdowns nativos, badges de confidence con colors básicos
- Pulir muy fuerte:
  - Confidence badges con **glow proportional** (verde 0.85+ con halo verde, amarillo 0.5-0.85 con halo cobre, rojo <0.5 con halo rojo + pulse)
  - Filas con `confidence < 0.5` con borde-left animado en `--pr` (3px que pulsa)
  - Match automático: cuando confidence > 0.7, mostrar checkmark verde con stagger entrance al montar la tabla
  - Score input: si parsing falla, shake animation
  - Dropdown atleta: replace con shadcn Combobox con search (instala `pnpm dlx shadcn@latest add command popover`)
  - Alias prompt ("¿Guardar 'Memo' como Guillermo?"): toast/inline con slide-down + accent en `--strain`
- Emoji icon by category: 🏋️ STRENGTH, 🤸 GYMNASTICS, 🏃 MONOSTRUCTURAL, 🎯 OLYMPIC

**Step 3 — Done**:

- Estado actual: checkmark verde + texto + 2 botones
- Pulir: confetti al landing (ya existe `canvas-confetti` en deps). Animación de éxito tipo Apple — checkmark dibuja stroke + escala + fade. "1 score guardado" con counter animation. Si hay PR detectado en el bulk, un badge especial "🏆 PR detectado".

---

### 🥈 P2 — `/admin/auditoria` (TRAZABILIDAD = CONFIANZA)

**Path**: `src/app/admin/auditoria/page.tsx`

**Estado actual**: Timeline básico con cards rectangulares, role badge, action name texto crudo.

**Pulir**:

- Timeline tipo Linear/Slack: línea vertical en el lateral con dots por evento
- Avatar circular del actor (iniciales + color hashed por userId)
- Iconos por action enum:
  - 💰 PAYMENT_REGISTERED, PAYMENT_CONFIRMED
  - ✂️ APPLY_DISCOUNT (si existe)
  - ↩️ PAYMENT_VOIDED, MEMBERSHIP_CANCELLED
  - 👤 ATHLETE\_\*
  - 🏋️ SCORE_SUBMITTED, BULK_SCORES_FROM_WHITEBOARD, PR_ACHIEVED
  - 📷 WHITEBOARD_UPLOADED
  - 🔒 PERMISSION\_\*
  - ⚠️ ALERT\_\*
- Severity dot: gris (info), amber con pulse-soft (warning), `--pr` con pulse-strong (sensitive)
- Verbo legible en español ("cobró", "registró", "canceló") en lugar de enum raw
- Filtros HOY/3D/7D/30D: pill toggles con active state animado (layoutId tipo TabBar)
- Empty state ilustrado para "no hay eventos sensibles hoy" con icon ✨

---

### 🥉 P3 — `/atleta/movimientos` y `/atleta/movimientos/[id]`

**Paths**: `src/app/atleta/movimientos/page.tsx`, `src/app/atleta/movimientos/[id]/page.tsx`

**Estado actual**: lista cruda + página detalle con iframe.

**Pulir lista**:

- Grid responsive de cards (2 col mobile, 3 col tablet, 4 col desktop)
- Cada card: thumbnail YouTube (`https://img.youtube.com/vi/{videoId}/maxresdefault.jpg` extraído del videoUrl), nombre, badge categoría
- Hover: scale 1.03 + shadow-glow del color de la categoría
- Categoría chips colored:
  - STRENGTH: `--strain`
  - GYMNASTICS: `--recovery`
  - OLYMPIC: gradient grad
  - MONOSTRUCTURAL: amber
  - ACCESSORY: ghost
- Filtro por categoría arriba: pill toggles
- Search bar con debounce + icon

**Pulir detalle**:

- Hero con iframe YouTube responsive 16:9
- Layout 2-col en desktop: video izq, descripción + tips + "ver en mi WOD" der
- Si está en WOD del día: badge prominente con CTA "Vamos a hacerlo →" gradient
- Equipment list con icons (barbell 🏋️, dumbbell 💪, kettlebell 🟢, etc.)
- Sticky bottom bar mobile: "Ver mi WOD del día"

---

### 🥉 P4 — `/admin/ajustes/permisos` (MATRIZ RBAC)

**Path**: `src/app/admin/ajustes/permisos/page.tsx`

**Estado actual**: matriz con checkboxes nativos + threshold inputs.

**Pulir**:

- Grid table elegante: filas=acciones (con icon + descripción legible), columnas=roles
- Switch animados (Radix Switch + Framer) en lugar de checkboxes
- Threshold sliders: cuando aplica, slider con valor numérico flotante + currency formatting (MXN)
- Toggle "requiresOwnerApproval" con visual distinto (gold/amber con icono 🛡️)
- Save button: sticky bottom con "Cambios pendientes (3)" counter, gradient cuando dirty
- Confirmación de save con toast success + slide-out

**Tagline arriba**: _"Define qué puede tocar cada quién. El dueño manda."_

---

### 🥉 P5 — `/admin/ajustes/alertas` (CRUD ALERTAS)

**Path**: `src/app/admin/ajustes/alertas/page.tsx`

**Pulir**:

- Cards verticales por regla en lugar de tabla cruda
- Toggle enabled grande + colorido
- Channel chips: 📧 EMAIL, 📱 PUSH, 🔔 IN_APP, 🌟 BOTH (gradient)
- Threshold con currency input pulido
- Recipients: avatar stack (max 3 + "+N more")
- Botón "Nueva alerta" con icon + gradient
- Modal de edit con form animado

---

### 📋 P6 — Componentes flotantes (TOP-LEVEL POLISH)

**`src/components/atleta/NotificationBell.tsx`**:

- Estado: bell con badge count, popover crudo
- Pulir: badge con pulse en `--pr` cuando hay nuevas, animación bell-shake al recibir notif (poll detectó cambio), popover con backdrop blur, lista de notifs con stagger entrance, "Marcar todo leído" como text-button discreto, empty state ilustrado

**`src/components/atleta/InstallPwaBanner.tsx`**:

- Estado: banner crudo arriba con texto + botón
- Pulir: slide-down entrance, gradient subtle, icono device, dismissable con animación shrink, recordar dismiss en localStorage 7d

**`src/components/atleta/QuickSurvey.tsx`**:

- Estado: 3 botones grandes con emoji
- Pulir: emoji bounce on hover, tap → scale + checkmark stagger, auto-advance con slide horizontal entre preguntas, progress dots arriba (1/3 · 2/3 · 3/3), submit final → ✓ + fade-out + thank-you toast 1.5s
- Importante: feel JOYFUL — esto es lo más visible del atleta

**`src/components/atleta/PushSubscribeButton.tsx`**:

- Estado: botón solo
- Pulir: si no permission → CTA gradient + icon bell. Si granted → estado "Activadas" con checkmark verde y ring sutil. Si denied → instrucción "Habilita en ajustes del navegador" con link

---

### 📋 P7 — `/admin/ajustes/apodos` (DICCIONARIO ALIAS)

**Path**: `src/app/admin/ajustes/apodos/page.tsx`

**Pulir**:

- Lista en cards: chip del alias → arrow → nombre completo del atleta
- Search bar
- Empty state lindo "Aún no hay apodos. La app aprenderá conforme uses la pizarra OCR."
- Botón borrar con confirmación inline

---

### 📋 P8 — `/admin/movimientos` (ADMIN OVERRIDE)

**Path**: `src/app/admin/movimientos/page.tsx`

**Pulir**:

- Tabla con thumbnail + nombre + categoría + status (estándar | override)
- Click row → drawer/modal con form para editar videoUrl
- Botón "Restaurar al estándar" con icon ⏪
- Filtros por categoría

---

## 🎯 Sidebar admin badge (ya cableado, falta pulir)

Path: `src/components/AdminSidebar.tsx` línea ~410

El badge ya muestra count de eventos sensibles hoy en "Auditoría". Pulir:

- Si count > 0: pulse animation continua sutil (ease-in-out infinite)
- Hover en el link "Auditoría" con count: tooltip "X eventos sensibles hoy"
- Si count >= 10: cambiar color de fondo del badge a gradiente alarm

---

## 🎁 Detalles que importan (pasada al final)

1. **Loading states**: cada server action puede tardar (Gemini ~9s). Reemplazar `disabled + texto "Procesando..."` con skeleton + progress dots animados.
2. **Empty states**: cada lista vacía debe tener ilustración + microcopy útil. NO "No hay datos."
3. **Error states**: errores rojo crudo → toast con icon + acción ("Reintentar")
4. **Microcopy**: revisa todos los `<p className="text-white/60">...` y mejora el copy. Usa segunda persona ("Tu score", "Tus atletas").
5. **Dark mode**: el proyecto ya es dark by default. NO inventes light mode todavía (queda para Día 3).
6. **Mobile gestures**: swipe-to-dismiss en notifs/banners donde aplique.

---

## ⚠️ Anti-patterns que NO violar

- **NO redefinas tokens** del brand. Usa los que existen.
- **NO instales librerías de animación** distintas a Framer Motion (ya instalada).
- **NO toques `_design-source/`** — es referencia, no compila.
- **NO uses imágenes hosteadas externas** salvo YouTube thumbnails. Para iconos, prefiere SVG inline.
- **NO commits sin** `pnpm typecheck && pnpm lint && pnpm test` verde.
- **NO uses `--no-verify`** ni `--amend` después de hook fail.
- **NO mezcles Tailwind v3 con v4 syntax** (estamos en v3).

---

## ✅ Verificación antes de commit

Cada vez que cierres una page:

```bash
pnpm typecheck  # cero errores
pnpm lint       # cero warnings
pnpm test       # 430/430 verde
```

Y ejecuta `/visual-iterate` (skill global) — toma screenshots a 360/768/1280 y detecta regresiones.

---

## 🚀 Convención de commits

```
chore(visual): pulido [page-name] — [efecto principal]
```

Ejemplos:

- `chore(visual): pulido auditoria — timeline + severity glow`
- `chore(visual): pulido step2review — confidence halos + alias toast`
- `chore(visual): pulido movimientos atleta — grid cards + thumbnails`

Co-author tag: `Co-Authored-By: Kimi K2 <noreply@kimi-k2.ai>` o el que uses.

---

## 📦 Orden sugerido (8 commits, ~1 día)

1. **Step2Review wizard** (P1) — más impacto, más visible
2. **Step1Upload + Step3Confirm** (P1 cont.)
3. **Auditoría timeline** (P2)
4. **Movimientos atleta** (P3)
5. **Permisos + Alertas + Apodos** (P4+P5+P7) — bundle settings
6. **Componentes flotantes** (P6) — bell, banner, survey, push button
7. **Movimientos admin + Sidebar badge polish** (P8 + sidebar)
8. **Pasada final**: loading/empty/error states + microcopy

---

## Recursos

- Plan original: `~/.claude/plans/f-jate-que-quiero-hacer-gentle-newell.md`
- DEMO guide para entender el flujo: `DEMO.md`
- Screenshots del estado actual (sin pulir): `.playwright-mcp/demo-*.png`
- Memoria Engram: `proj.kronos.smoke_ocr_validated`
- Decisiones del grill (D1-D19): explicadas en `~/.claude/plans/f-jate-que-quiero-hacer-gentle-newell.md`

---

**Punch line para tu trabajo**: cuando termines, este producto debe sentirse digno de cobrar $50 USD/mes a un dueño de box. No genérico SaaS. Premium. Con personalidad. Que cuando lo enseñe Samuel a un dueño piloto, diga "wow, esto se ve como Linear/Notion/Stripe en versión CrossFit".

Dale.
