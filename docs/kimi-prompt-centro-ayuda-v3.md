# Prompt para Kimi Code — Centro de Ayuda V3 (Kronos)

> Cópialo entero a Kimi Code en una sesión limpia con cwd en `~/Documents/proyectos/kronos`.

---

## Contexto

Kronos es un SaaS multi-tenant CrossFit (Next.js 15, brand V3 "Cuarto Oscuro" lima neon `#C8FF2D` monocromático, Plex Mono + Inter, dark-only). PWA mobile-first en `kronos-fit.com`.

El **Centro de Ayuda del atleta** (`/atleta/ayuda`) ya existe en main con **6 tutoriales** generados con la skill `kronos-guide-engine`:

```
public/tutorials/
├── home-tour/         (5 frames, ~27s)
├── reserva-clases/    (4 frames, ~26s)
├── skills-atleta/     (6 frames, ~32s)
├── wod-del-dia/       (6 frames, ~32s)
├── perfil-y-prs/      (6 frames, ~32s)
└── salud-wellness/    (5 frames, ~26s)
```

Cada tutorial tiene:

- `storyboard.json` — pasos con `title`, `description`, `narration`, `url`, `scrollY`, `duration`, `screenshot`
- `screenshots/0N-*.png` — capturas PWA mobile 390×844 de Bernardo Quiroz en prod
- `index.html` — guía interactiva standalone (lo que el atleta ve al tap "Ver Guía")
- `tutorial.mp4` — video con voz narrada
- `voiceover.mp3` — audio Edge TTS Dalia es-MX
- `flow.excalidraw.json` — diagrama de flujo editable

El wiring del page está en `src/app/atleta/ayuda/page.tsx` (lista 6 cards con thumbnail + 2 CTAs "Ver Guía Interactiva" / "Ver Video").

## Lo que NO sirvió (feedback de Samuel)

Samuel probó en su iPhone y reportó dos quejas:

1. **El "Ver Guía" se siente estático** — quería **zoom in / zoom out** en las screenshots (pinch en mobile, scroll en desktop) y más interactividad.
2. **La voz suena robótica** — Edge TTS Dalia es-MX, aunque es es-MX, suena sintética. Quiere voz más natural, más limpia.

## Objetivos V3

### 1) Guía HTML interactiva con zoom + UX rica

Reescribir `public/tutorials/[id]/index.html` (los 6 archivos) con:

- **Pinch-zoom** mobile + **scroll-zoom** desktop sobre cada screenshot. Sugerencia: `panzoom` (npm) o vanilla con `pointer events`. NO usar Lightbox que rompa el flujo.
- **Auto-play** opcional: progress bar en lima, controles play/pause/speed (1x/1.5x/2x), botones prev/next.
- **Captions sincronizados** debajo del frame (la `narration` del storyboard) con highlight de la frase activa.
- **Mini-mapa lateral** (desktop) o **dots inferior** (mobile) de los N steps con preview al hover.
- **Hotspots opcionales** — si un step tiene `hotspot: {x,y,width,height}` en el storyboard, dibujar un anillo lima animado sobre esa zona del frame.
- Diseño respeta brand V3: dark `#08080A`, lima `#C8FF2D`, Plex Mono headings, Inter body, sin colores fuera de la paleta.
- **Standalone**: cada `index.html` no debe depender de la app Next — sirve directo desde `/tutorials/[id]/index.html` sin SSR. Permitido cargar libs vía CDN (`unpkg`, `jsdelivr`) o inline.
- **Accesibilidad**: focus visible, Esc cierra zoom, arrows ←→ para prev/next step, captions con `aria-live`.

### 2) Voz natural

Reemplazar `voiceover.mp3` y `tutorial.mp4` de los 6 tutoriales con voz menos robótica. Opciones (recomendado primero):

| Engine                         | Voz sugerida                      | Costo aprox                            | Calidad                    |
| ------------------------------ | --------------------------------- | -------------------------------------- | -------------------------- |
| **ElevenLabs Multilingual v2** | "Bella" o "Domi" (español)        | ~$0.30/1000 chars · total ~$1.10 los 6 | ⭐⭐⭐⭐⭐                 |
| **Cartesia Sonic**             | voice castellano femenino         | ~$0.15/1000 chars · total ~$0.55 los 6 | ⭐⭐⭐⭐                   |
| **OpenAI TTS**                 | `tts-1-hd` voz `nova` o `shimmer` | ~$0.03/1000 chars · total ~$0.10 los 6 | ⭐⭐⭐⭐ (es-MX no nativo) |
| **Google Cloud TTS**           | `es-MX-Studio-A` (Neural2)        | ~$0.016/1000 chars · total ~$0.06      | ⭐⭐⭐⭐                   |

**Recomendación**: ElevenLabs si calidad es prioridad, OpenAI `tts-1-hd nova` como balance costo/calidad.

Las narraciones a usar están en `public/tutorials/[id]/storyboard.json` campo `steps[].narration`. Total ~3,600 chars suma de los 6.

### 3) Regenerar MP4 con la voz nueva

Después de tener `voiceover.mp3` nuevo, regenerar `tutorial.mp4` usando el script existente:

```bash
pnpm exec tsx ~/.claude/skills/kronos-guide-engine/scripts/export-video.ts \
  public/tutorials/[id]/index.html \
  public/tutorials/[id]/tutorial.mp4 \
  public/tutorials/[id]/voiceover.mp3
```

(El script ya está testeado y funciona.)

## Gates de costo (HARD)

- TTS engine es la única decisión con costo real. Antes de generar los 6 voiceovers, **avisa el costo total estimado y pide confirmación** (sigue la regla de `~/.claude/CLAUDE.md` → rango $0.05-$0.50 = "pedir confirmación explícita").
- Si eliges ElevenLabs (~$1.10), aplica regla de **$0.50-$1 = pedir confirmación con alternativa** — propone una opción más barata (OpenAI/Google) como fallback.
- API keys: ver `~/.claude/credentials/image-apis.env` para ElevenLabs/OpenAI keys. Si no están, pedirle a Samuel.

## Archivos relevantes

| Archivo                                     | Acción                                                                           |
| ------------------------------------------- | -------------------------------------------------------------------------------- |
| `public/tutorials/[id]/index.html` × 6      | **Reescribir completo** con zoom + auto-play + captions sincronizados + hotspots |
| `public/tutorials/[id]/voiceover.mp3` × 6   | **Regenerar** con TTS premium                                                    |
| `public/tutorials/[id]/tutorial.mp4` × 6    | **Regenerar** después del MP3                                                    |
| `public/tutorials/[id]/storyboard.json` × 6 | Solo lectura. Si necesitas agregar `hotspot` por step, edita aquí.               |
| `src/app/atleta/ayuda/page.tsx`             | No tocar (data layer ya funciona).                                               |
| `_design-source/`                           | Solo referencia (no compila).                                                    |

## Criterios de aceptación

- [ ] Los 6 `index.html` cargan con pinch-zoom funcional en iPhone Safari + scroll-zoom desktop.
- [ ] Cada paso tiene narración natural (no robótica) sincronizada con caption visible.
- [ ] Auto-play y controles funcionan (play/pause/speed/prev/next).
- [ ] Diseño respeta brand V3 (lima neon + Plex Mono + dark). Nada de colores cyan/azul/verde-teal.
- [ ] `pnpm typecheck` + `pnpm lint` pasan verde.
- [ ] `pnpm build` produce el bundle sin error.
- [ ] **Validación con `/visual-iterate` obligatoria** (regla dura del proyecto): 360px / 768px / 1280px breakpoints. Samuel no manda screenshots.
- [ ] Tutoriales accesibles via `/atleta/ayuda` → "Ver Guía Interactiva" en cada card.

## Pipeline sugerido

1. **Recon** (~5 min): `/recon kronos centro-ayuda-v3` — lee el estado actual, los 6 tutoriales, la skill `kronos-guide-engine`.
2. **Prototipa** 1 tutorial (sugerido `home-tour` que es el corto): reescribe `index.html` con zoom + auto-play. Pide a Samuel feedback visual antes de aplicar a los otros 5.
3. **Genera 1 voiceover de prueba** con la opción TTS elegida → Samuel valida que la voz no es robótica.
4. **Aplica a los 6**: replica el HTML pattern + genera los 6 MP3 + 6 MP4.
5. **Visual-iterate** en `/atleta/ayuda` y en `/tutorials/home-tour/index.html` a 3 breakpoints.
6. **Commit + push + deploy** (sigue runbook en `~/.claude/projects/-Users-samuelquiroz-Documents-proyectos/memory/kronos/runbook-deploy.md`).

## Server prod (si necesitas deploy)

- SSH: `ssh -i ~/Desktop/certificados/labsisapp.pem dynamtek@ec2-3-239-101-100.compute-1.amazonaws.com`
- App: `/home/dynamtek/kronos`
- Deploy: `git pull && pnpm install --frozen-lockfile && pnpm build && pm2 reload kronos --update-env`
- Domain: `kronos-fit.com`

## Anti-patrones (NO hacer)

- ❌ Usar shadcn modal/dialog pesado para el zoom — overkill.
- ❌ Cargar 50 KB de librería para el zoom cuando 3 KB inline alcanza.
- ❌ Romper el standalone del HTML cargando bundle de Next.
- ❌ Cambiar el wiring de `page.tsx` (la lista de 6 cards). Ya funciona.
- ❌ Decidir TTS sin avisar costo a Samuel.
- ❌ Saltar `/visual-iterate` al final — el hook `ui-dirty-check.sh` BLOQUEA el cierre.
- ❌ Editar archivos en `~/.claude/skills/kronos-guide-engine/` (eso es global, no del repo).

## Atleta de prueba

Para validar visualmente con datos reales:

- Login: `bernardo.quiroz+demo@kronos-fit.com` / `demo-bernardo-2026`
- Box: `iron-hands-bernardo-demo` (no es personal box — tiene clases programadas)
- Data: 71 scores, racha 10 días, próxima clase mañana 7am MX, peso 75 kg, altura 190 cm, IMC 20.8.

## Salida esperada

Cuando termines:

- 6 tutoriales con HTML interactivo + voz natural + MP4 regenerado.
- 1 PR a `main` con título tipo `feat(atleta/ayuda): V3 — zoom interactivo + voz natural`.
- Resumen de costo final del TTS gastado.
- Confirmación de `/visual-iterate` corrido a 3 breakpoints.

**Listo.** Si tienes dudas antes de empezar, pregúntale a Samuel — sin asumir.
