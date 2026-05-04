# \_design-source — Kronos Design Reference

Material producido en Claude Design (Canva) antes del scaffold de Next.js.
**No se compila ni se sirve** — es referencia pura para el desarrollo.

## Dirección final: "Kronos · App de CrossFit"

Los archivos en uso activo:

| Archivo                                       | Portado a                                                                | Notas                                       |
| --------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------- |
| `styles-kronos.css`                           | `src/app/globals.css` + `tailwind.config.ts`                             | Tokens CSS completos                        |
| `k-prims.jsx` — `Phone`, `TabBar`, `HaloRing` | `src/components/kronos/TabBar.tsx`, `src/components/kronos/HaloRing.tsx` | Shells en Fase 0, completos en Fase 1       |
| `k-home.jsx`                                  | `src/app/atleta/page.tsx`                                                | Porting completo en Fase 1                  |
| `k-booking.jsx`                               | `src/app/atleta/reservar/page.tsx`                                       | Porting en Fase 1                           |
| `k-wod.jsx`                                   | `src/app/atleta/wod/page.tsx`                                            | Porting en Fase 1                           |
| `k-atleta.jsx`                                | `src/app/atleta/perfil/page.tsx`                                         | Porting en Fase 1                           |
| `screen-*.jsx`                                | `src/app/atleta/`                                                        | Variantes de pantalla — consultar en Fase 1 |

## Direcciones descartadas (contexto histórico)

- `v2-sangre.jsx` — brutalismo deportivo (rojo + crema + Anton condensed)
- `v2-cobalto.jsx` — telemetría (azul Klein + amarillo + IBM Plex Mono)
- `v2-cal.jsx` — print editorial (papel + bermellón + Newsreader)
- `whoop-*.jsx`, `styles-whoop.css` — exploración Whoop-style intermedia

## Sistema visual extraído

Ver `styles-kronos.css` para los tokens originales.
La versión adaptada para Next.js vive en `src/app/globals.css`.

Fuentes: Inter (UI) · Space Grotesk (display) · JetBrains Mono (datos)
