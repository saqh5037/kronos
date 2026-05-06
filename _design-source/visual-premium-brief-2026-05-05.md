# Brief visual premium — Kronos 2026-05-05

> Para Kimi. Sprint paralelo al backend de IA que está haciendo Claude.
> Lane: UI / decoración visual / canvas / video. NO tocar `src/server/**`,
> `src/lib/**` (excepto tokens en `globals.css`), schema Prisma.

## Contexto

Samuel quiere llevar Kronos a tier "premium tipo data-art dark". La inspiración NO es WHOOP (minimalista blanco). Es:

```
/Users/samuelquiroz/Documents/proyectos/kronos/Imspiracion/
  ├── artistic-3d-scratch-colorful-futuristic-background/17.jpg
  ├── conceptual-colorful-3d-chaos-background/38.jpg
  ├── creative-colorful-chaos-background/77.jpg
  ├── 0_Stock_Chart_Market_Graph_4096x2160.mov   ← hero video opcional
  └── 0_Growth_Chart_Business_4096x2160.mov      ← hero video opcional
```

Los 3 JPGs muestran:

- Navy profundo (más oscuro que el `--bg #141414` actual del dark mode, target `#070d1a` o `#0a0f1f`)
- **Mesh de partículas** que forman figuras orgánicas (líneas con scratchy texture)
- **Gradiente explosivo multi-color**: magenta → orange → yellow → cyan en un mismo elemento
- Tipografía bold letter-spaced sobre el chaos visual

## Decisiones tomadas (Samuel ya las aprobó)

1. **Mesh de partículas animado** en 3 lugares:
   - Hero del atleta home (`src/app/atleta/page.tsx` — envolver `AnimatedStats`)
   - Hero del admin dashboard (`src/app/admin/page.tsx` — KPIs principales)
   - Background global sutil (z-index bajo, opacidad 4-8%, `src/app/layout.tsx`)
2. **Paleta**: la actual se queda. Se SUMAN dos tokens neon SOLO para features de IA:
   - `--ai-primary: #ff2bd6` (magenta/fuchsia)
   - `--ai-secondary: #00e5ff` (cyan)
   - Gradiente AI: `--grad-ai: linear-gradient(95deg, #ff2bd6 0%, #6a3bff 50%, #00e5ff 100%)`
3. **Hero video real**: `<video autoplay loop muted playsinline poster="…">` como background del hero atleta. Solo desktop. Mobile = poster estático.
4. **Fallback obligatorio**: en `<768px` y con `prefers-reduced-motion: reduce`, se desactivan canvas + video. Ven gradiente estático bonito, no parpadeo.

## Tu trabajo en orden

### 1. Tokens nuevos en `src/app/globals.css`

Agregar al `:root` y `.dark` los tokens AI:

```css
/* Color de inteligencia — solo features IA */
--ai-primary: #ff2bd6;
--ai-secondary: #00e5ff;
--ai-tertiary: #6a3bff;
--ai-soft: rgba(255, 43, 214, 0.1);
--ai-line: rgba(255, 43, 214, 0.35);
--grad-ai: linear-gradient(95deg, #ff2bd6 0%, #6a3bff 50%, #00e5ff 100%);
--grad-ai-soft: linear-gradient(
  95deg,
  rgba(255, 43, 214, 0.14),
  rgba(0, 229, 255, 0.14)
);
--shadow-ai:
  0 0 24px rgba(255, 43, 214, 0.35), 0 0 48px rgba(0, 229, 255, 0.18);

/* Premium dark — más profundo */
/* en .dark: */
--bg-deep: #070d1a; /* hero deep navy */
--bg-deep-2: #0a0f1f; /* slightly lighter */
```

Y agregar utility class:

```css
.k-card-ai {
  background: var(--card);
  border: 1px solid var(--ai-line);
  box-shadow: var(--shadow-ai);
  position: relative;
  overflow: hidden;
}
.k-card-ai::before {
  content: "";
  position: absolute;
  inset: -1px;
  background: var(--grad-ai-soft);
  opacity: 0.3;
  z-index: 0;
  pointer-events: none;
}
.k-card-ai > * {
  position: relative;
  z-index: 1;
}
.k-badge-ai {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ai-primary);
  padding: 2px 6px;
  border: 1px solid var(--ai-line);
  background: var(--ai-soft);
  border-radius: 4px;
  display: inline-block;
}
```

### 2. Componente `<ParticleMesh />` — nuevo

Crear `src/components/kronos/ParticleMesh.tsx`. Canvas-based (no WebGL — más liviano y compatible).

Specs:

- Props: `density` (default 60 partículas), `colorPrimary`, `colorSecondary`, `connectionDistance` (default 120), `mouseInteraction` (boolean), `className`
- Render canvas que ocupa el contenedor (100% / 100%)
- Partículas con tamaños variables (1-3px), posiciones random, velocidades suaves (0.2-0.6 px/frame)
- Conexiones entre partículas cercanas (line con opacity proporcional a distancia)
- Color: gradient animado por partícula (interpola entre `colorPrimary` y `colorSecondary` a lo largo del tiempo)
- Performance: usar `requestAnimationFrame`, throttling a 30fps en mobile, off-screen canvas si la pestaña pierde foco
- **Fallback**: si `window.matchMedia('(prefers-reduced-motion: reduce)').matches` → render gradiente estático SVG, no canvas
- **Mobile**: si `window.innerWidth < 768` → density / 2 o gradiente estático según prop `mobileBehavior`

Ejemplo de uso esperado:

```tsx
<ParticleMesh
  density={80}
  colorPrimary="#ff2bd6"
  colorSecondary="#00e5ff"
  connectionDistance={140}
  mobileBehavior="static-gradient"
  className="absolute inset-0 -z-10"
/>
```

### 3. Componente `<HeroVideoBackground />` — nuevo

Crear `src/components/kronos/HeroVideoBackground.tsx`.

Specs:

- Props: `srcWebm`, `srcMp4`, `poster`, `overlayOpacity` (default 0.5), `className`
- Render `<video autoplay loop muted playsinline preload="metadata">` con sources webm + mp4
- Overlay arriba: `<div>` con gradient lineal `linear-gradient(180deg, rgba(7,13,26,0.3) 0%, rgba(7,13,26,0.85) 100%)` para que el contenido encima sea legible
- **Fallback**:
  - mobile (<lg breakpoint): solo render `<img poster>` no `<video>`
  - `prefers-reduced-motion`: idem
  - sin video disponible: gradient lineal sólido como fallback
- Usar `loading="lazy"` y un `IntersectionObserver` para no cargar el video si el hero está fuera de viewport (en pages con scroll largo)

### 4. Comprimir los .mov

Los archivos están en 4096×2160 sin compresión (probablemente +500MB cada uno). Comando para web:

```bash
# WebM (mejor compresión para Chrome/Firefox)
ffmpeg -i 0_Stock_Chart_Market_Graph_4096x2160.mov \
  -vf scale=1920:-2 -c:v libvpx-vp9 -b:v 1.5M -an \
  public/hero/stock-chart-1080p.webm

# MP4 H.264 (Safari fallback)
ffmpeg -i 0_Stock_Chart_Market_Graph_4096x2160.mov \
  -vf scale=1920:-2 -c:v libx264 -preset slow -crf 28 -an -movflags +faststart \
  public/hero/stock-chart-1080p.mp4

# Poster (1er frame)
ffmpeg -i 0_Stock_Chart_Market_Graph_4096x2160.mov -vframes 1 \
  -vf scale=1920:-2 -q:v 3 public/hero/stock-chart-poster.jpg
```

Repetir para `0_Growth_Chart_Business_4096x2160.mov` (versión admin).

Resultado esperado: 5-10MB por video, 200KB poster.

### 5. Aplicar a las pages

#### `/atleta` (home — `src/app/atleta/page.tsx`)

Wrap del hero (líneas ~131-185, `<AnimatedSection>` HEADER + `<AnimatedStats>`) en un contenedor con:

- `<HeroVideoBackground>` con `stock-chart-1080p` detrás
- `<ParticleMesh>` encima del video con `mix-blend-mode: screen` y opacidad reducida
- Contenido (HEADER + AnimatedStats) en `z-10` sobre todo

Crítico: la **frase IA personalizada** que Claude va a inyectar (como `<PersonalizedGreeting>`) debe ir entre el HEADER y `AnimatedStats`. Reservá ese espacio en el layout — Claude pondrá el componente.

#### `/admin` (dashboard — `src/app/admin/page.tsx`)

Solo en el hero KPI principal (la primera fila de `MetricDelta`/`Sparkline`). Mismo patrón con `growth-chart-1080p`.

#### `src/app/layout.tsx` (background global)

Sobre `<body>` agregar un `<ParticleMesh density={30} className="fixed inset-0 -z-50 opacity-[0.06]" mobileBehavior="hidden" />` — sutil, decorativo, no compite con el contenido.

### 6. Preservar los componentes IA que Claude inyecta

Claude va a crear:

- `<PersonalizedGreeting />` en hero atleta (después del HEADER) — usá `k-card-ai` y `k-badge-ai`
- Sección "Próximos PRs estimados" en `/atleta/perfil` (3 cards con sparklines) — también `k-card-ai`
- (Si hay tiempo) Botón "Generar plan con IA" junto a Goals — botón con `--grad-ai`

Tu trabajo: **NO modificar** la lógica/datos de esos componentes. Solo aplicar `k-card-ai`, ajustar spacing, agregar micro-interacciones (hover scale 1.01, glow pulse) si querés. Y asegurar que se vean coherentes con el mesh y el video del hero.

## Lo que NO toca este sprint

- Cambiar la paleta actual (fire/moss/ember/steel — todos quedan igual)
- Tocar el dashboard del admin más allá del hero KPI
- Pages /admin/ajustes, /admin/comunicaciones (otro sprint)
- Schema Prisma (Claude ya agregó `videoUrlCues`, lo respetás)

## Verificación al cerrar

- `pnpm typecheck` limpio
- `pnpm lint` limpio
- `/visual-iterate` en `/atleta`, `/admin`, `/atleta/perfil` — auto-validar a 360/768/1280
- Smoke en mobile real: el video NO debe descargar, solo poster
- Smoke con DevTools "Reduce Motion" activo: canvas debe estar reemplazado por gradiente

## Coordinación con Claude

- Claude no toca `globals.css` excepto si necesita un token nuevo de IA (ej: `--ai-soft`). Si lo hace, te avisa.
- Claude no toca componentes en `src/components/kronos/` excepto los nuevos de IA (`PersonalizedGreeting.tsx`, `PRPredictionCard.tsx`).
- Vos no tocás `src/lib/ai/**` ni `src/server/actions/ai.ts` — eso es 100% Claude.
- Los conflictos los resolvemos commit a commit (rebase, no merge).
