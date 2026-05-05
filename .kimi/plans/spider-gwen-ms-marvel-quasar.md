# Audit: Colores hardcodeados que asumen tema oscuro — Kronos

## Resumen ejecutivo

El proyecto **no usa** las clases Tailwind estándar tipo `bg-gray-900`, `text-gray-200`, `border-gray-700`, etc. El acoplamiento al tema oscuro no está en utilities sueltas sino en el **sistema de diseño entero**: tokens CSS y Tailwind custom que están fijados a valores oscuros. Además existen
~32 líneas con colores hardcodeados (`text-white`, `rgba(255,255,255,...)`, `#fff`, `#101316`, `#0a1a14`, `bg-black/60`) dispersos en componentes.

---

## Hallazgos por categoría

### 1. Design tokens hardcodeados a oscuro (raíz del problema)

| Archivo               | Líneas | Qué contiene                                                                                                                                                                                                        |
| --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/globals.css` | 7–24   | `:root` fija `--bg: #1a1d20`, `--bg-soft: #23272b`, `--card: #2a2f33`, `--card-2: #34393e`, `--text: #fff`, `--text-2: rgba(255,255,255,0.62)`, `--text-3: rgba(255,255,255,0.4)`, `--line: rgba(255,255,255,0.08)` |
| `tailwind.config.ts`  | 13–22  | Mapea los mismos valores oscuros como colores Tailwind (`bg`, `bg-soft`, `card`, `card-2`, `line`)                                                                                                                  |

**Impacto:** Todo el proyecto hereda dark mode por defecto. No hay tokens light equivalentes.

---

### 2. `text-white` / `placeholder-white` / `text-white/...` en componentes

| Archivo                                    | Líneas       | Detalle                                                     |
| ------------------------------------------ | ------------ | ----------------------------------------------------------- |
| `src/app/layout.tsx`                       | 38           | `<body className="... bg-bg text-white ...">`               |
| `src/app/(auth)/login/LoginForm.tsx`       | 46, 102, 111 | `text-white placeholder-white/30` en 3 inputs               |
| `src/components/admin/BoxSettingsForm.tsx` | 214          | `text-white` en clase de input compartida                   |
| `src/components/AdminSidebar.tsx`          | 344          | `text-white`, `text-white/50`, `text-white/80` en nav items |

**Total: ~8 líneas**

---

### 3. `bg-black` / `bg-black/...` en componentes

| Archivo                           | Líneas | Detalle                                        |
| --------------------------------- | ------ | ---------------------------------------------- |
| `src/components/AdminSidebar.tsx` | 280    | `bg-black/60 backdrop-blur-sm` (overlay móvil) |

**Total: 1 línea**

---

### 4. `hover:bg-white/[...]` en componentes

| Archivo                       | Líneas | Detalle                                  |
| ----------------------------- | ------ | ---------------------------------------- |
| `src/app/admin/wods/page.tsx` | 97     | `hover:bg-white/[0.03]` en fila de tabla |

**Total: 1 línea**

---

### 5. Inline `rgba(255,255,255,...)` (más problemático)

| Archivo                               | Líneas              | Detalle                                                                  |
| ------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `src/app/globals.css`                 | 11, 13, 14, 71, 111 | Tokens `--line`, `--text-2`, `--text-3`, `.k-btn-ghost`, `.k-chip-ghost` |
| `src/components/kronos/TabBar.tsx`    | 107                 | `rgba(255,255,255,0.4)` en style inline                                  |
| `src/components/kronos/Podium.tsx`    | 78–79               | `rgba(255,255,255,0.06)` y `0.08` en style inline                        |
| `src/components/kronos/HaloRing.tsx`  | 58, 92              | `stroke="rgba(255,255,255,0.08)"`, `color: rgba(255,255,255,0.5)`        |
| `src/app/atleta/reservar/page.tsx`    | 238                 | `background: "rgba(255,255,255,0.06)"`                                   |
| `src/app/atleta/wod/page.tsx`         | 90, 149, 314        | `0.06`, `0.1`, `0.12` en borders/backgrounds inline                      |
| `src/app/admin/programacion/page.tsx` | 188                 | `background: "rgba(255,255,255,0.06)"`                                   |
| `src/app/admin/asistencia/page.tsx`   | 46                  | `border: "1px solid rgba(255,255,255,0.06)"`                             |
| `src/app/admin/reportes/page.tsx`     | 220, 347            | `background: "rgba(255,255,255,0.06)"` (×2)                              |

**Total: ~16 líneas**

---

### 6. Inline `#fff` / `"#ffffff"` / `stroke="#fff"`

| Archivo                            | Líneas   | Detalle                                             |
| ---------------------------------- | -------- | --------------------------------------------------- |
| `src/app/atleta/page.tsx`          | 292, 363 | `#fff` en style inline (texto de clase/leaderboard) |
| `src/app/atleta/reservar/page.tsx` | 123, 216 | `#fff` en style inline                              |
| `src/app/atleta/wod/page.tsx`      | 118      | `stroke="#fff"` en SVG                              |

**Total: 5 líneas**

---

### 7. Colores de contraste oscuros `#0a1a14` y `#101316`

Estos **no son problemáticos por sí solos** (son textos oscuros sobre gradientes claros), pero quedan anotados porque romperán si se invierte el tema:

| Archivo                             | Líneas   | Detalle                               |
| ----------------------------------- | -------- | ------------------------------------- |
| `src/app/globals.css`               | 62       | `.k-btn-grad { color: #0a1a14; }`     |
| `src/components/AdminSidebar.tsx`   | 244, 303 | `color: #0a1a14` en botones gradiente |
| `src/components/kronos/TabBar.tsx`  | 130      | `color: #0a1a14` en tab activa        |
| `src/components/kronos/Podium.tsx`  | 52       | `color: #0a1a14` para primer lugar    |
| `src/app/(auth)/login/page.tsx`     | 23       | `color: #0a1a14` en título/botón      |
| `src/app/atleta/perfil/page.tsx`    | 68       | `text-[#0a1a14]` en avatar            |
| `src/app/atleta/reservar/page.tsx`  | 115      | `color: #0a1a14` en slot activo       |
| `src/app/atleta/page.tsx`           | 119, 278 | `text-[#0a1a14]` en badge de ranking  |
| `src/app/atleta/wod/page.tsx`       | 89       | `background: #101316` en card         |
| `src/app/admin/prs/page.tsx`        | 57       | `background: #101316` en card         |
| `src/app/admin/asistencia/page.tsx` | 45       | `background: #101316` en card         |

**Total: ~13 líneas**

---

### 8. `dark:` classes

**Resultado: 0.** El proyecto no usa `dark:` en ningún lugar.

---

## Archivos más problemáticos (ranking)

| #   | Archivo                                    | Líneas afectadas | Severidad                                           |
| --- | ------------------------------------------ | ---------------- | --------------------------------------------------- |
| 1   | `src/app/globals.css`                      | ~15              | 🔴 Crítica — define todos los tokens oscuros        |
| 2   | `tailwind.config.ts`                       | ~5               | 🔴 Crítica — replica los mismos valores             |
| 3   | `src/app/atleta/page.tsx`                  | 4                | 🟡 Media — `#fff`, `#0a1a14` inline                 |
| 4   | `src/app/atleta/wod/page.tsx`              | 4                | 🟡 Media — `#101316`, `rgba(...)`, `#fff`           |
| 5   | `src/app/atleta/reservar/page.tsx`         | 4                | 🟡 Media — `#fff`, `#0a1a14`, `rgba(...)`           |
| 6   | `src/components/AdminSidebar.tsx`          | 4                | 🟡 Media — `bg-black/60`, `text-white/*`, `#0a1a14` |
| 7   | `src/app/admin/reportes/page.tsx`          | 2                | 🟡 Media — `rgba(...)` inline                       |
| 8   | `src/app/admin/asistencia/page.tsx`        | 2                | 🟡 Media — `#101316`, `rgba(...)`                   |
| 9   | `src/app/(auth)/login/LoginForm.tsx`       | 3                | 🟢 Baja — `text-white placeholder-white/30`         |
| 10  | `src/components/kronos/HaloRing.tsx`       | 2                | 🟢 Baja — `rgba(...)` en SVG                        |
| 11  | `src/components/kronos/Podium.tsx`         | 2                | 🟢 Baja — `rgba(...)` inline                        |
| 12  | `src/components/kronos/TabBar.tsx`         | 2                | 🟢 Baja — `rgba(...)` inline                        |
| 13  | `src/app/admin/programacion/page.tsx`      | 1                | 🟢 Baja — `rgba(...)`                               |
| 14  | `src/app/admin/prs/page.tsx`               | 1                | 🟢 Baja — `#101316`                                 |
| 15  | `src/app/admin/wods/page.tsx`              | 1                | 🟢 Baja — `hover:bg-white/[0.03]`                   |
| 16  | `src/components/admin/BoxSettingsForm.tsx` | 1                | 🟢 Baja — `text-white` en input                     |
| 17  | `src/app/layout.tsx`                       | 1                | 🟢 Baja — `text-white` en body                      |
| 18  | `src/app/(auth)/login/page.tsx`            | 1                | 🟢 Baja — `#0a1a14`                                 |
| 19  | `src/app/atleta/perfil/page.tsx`           | 1                | 🟢 Baja — `#0a1a14`                                 |

---

## Magnitud del trabajo

- **~55 líneas** con valores hardcodeados que asumen oscuro (sin contar los tokens raíz en CSS/Tailwind).
- **Todos los colores del design system** (~15 tokens) están fijos a valores oscuros.
- **18 archivos** tocan colores hardcodeados de forma directa.
- **~1,860 líneas** totales de código TSX/TS en `src/`.

**Conclusión:** No es un refactor masivo de "cambiar miles de clases Tailwind". Es un refactor de **arquitectura de tokens**: hay que hacer los design tokens theme-aware (por ejemplo con `prefers-color-scheme` o con un toggle de tema) y luego limpiar los ~55 valores hardcodeados dispersos. El esfuerzo es **medio-bajo en cantidad de archivos**, pero **alto en decisión de diseño** (¿se quiere soportar light mode realmente?).
