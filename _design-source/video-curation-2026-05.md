# Curaduría de videos de movimiento — 2026-05-05

> Tabla candidata. NO mergear al seed sin validar URLs (los IDs de YouTube pueden cambiar/borrarse).
> Workflow recomendado: validar embed real abriendo `https://www.youtube.com/embed/<ID>` en navegador.

## Inventario actual (50 movimientos)

- **32 con `videoUrl`** (64%): thruster, clean, snatch, clean-and-jerk, power-clean,
  dumbbell-snatch, turkish-get-up, push-press, push-jerk, deadlift, back-squat,
  front-squat, overhead-squat, bench-press, strict-press, pull-up, kipping-pull-up,
  chest-to-bar, muscle-up-ring, muscle-up-bar, bar-muscle-up, toes-to-bar,
  handstand-push-up, ring-dip, rope-climb, pistol-squat, row, double-under,
  air-squat, push-up, burpee, box-jump, wall-ball, kettlebell-swing
- **18 sin `videoUrl`** (36%): dumbbell-clean, farmers-carry, handstand-walk,
  bar-dip, hollow-rock, jumping-pull-up, knee-raise, run, bike, ski-erg,
  single-under, lunge, sit-up, ghd-sit-up, sled-push, sled-pull, devils-press,
  man-maker

## Criterio editorial (Samuel aprobó 2026-05-05)

- Demo visual limpia, ángulo frontal o 3/4
- Atleta competente, ejecución técnica correcta
- 1-3 minutos de duración
- Inglés OK (CrossFit es inglés)
- Canales preferidos por categoría:
  - **OLYMPIC + STRENGTH**: Catalyst Athletics, USA Weightlifting, Squat University
  - **GYMNASTICS**: CrossFit oficial, GymnasticBodies, The Barbell Physio
  - **MONOSTRUCTURAL**: CrossFit oficial, Concept2 oficial (row/ski), Rogue (assault)
  - **ACCESSORY**: CrossFit oficial, Wodify, Rogue Fitness

## Tabla de los 18 faltantes — IDs canónicos asignados (2026-05-05)

| Slug            | Nombre          | YouTube ID    | Fuente                                                |
| --------------- | --------------- | ------------- | ----------------------------------------------------- |
| dumbbell-clean  | Dumbbell Clean  | `CUaxieWW0tw` | The Dumbbell Clean — James Hobart, CrossFit oficial   |
| farmers-carry   | Farmers Carry   | `cBv3NcxqhPM` | The Farmer's Carry                                    |
| handstand-walk  | Handstand Walk  | `FdgJ9jZIT-Q` | The Handstand Walk — CrossFit oficial                 |
| bar-dip         | Bar Dip         | `eERwCQHZqfA` | The Bar Dip — James Hobart, CrossFit oficial          |
| hollow-rock     | Hollow Rock     | `SfkuOb_1GK8` | The Hollow Rock                                       |
| jumping-pull-up | Jumping Pull-up | `oBIFjk3cSQ4` | Jumping Pull-up — CrossFit oficial                    |
| knee-raise      | Knee Raise      | `lW4onyuCkzA` | Strict Hanging Knee Raise — CrossFit Movement Demo    |
| run             | Run             | `y1wnFWIisq8` | CrossFit — Running Fundamentals (Doug Katona)         |
| bike            | Bike (Assault)  | `mY9ihujdkc0` | Assault Bike Tips and Tricks for Efficiency and Power |
| ski-erg         | Ski Erg         | `B0lIgT5PHc8` | SkiErg Technique — Concept2 oficial                   |
| single-under    | Single Under    | `EwrFMvxMSkk` | Jump Rope — Single Unders                             |
| lunge           | Lunge           | `JRh6_4rq-b8` | Reebok CrossFit ONE — Walking Lunge                   |
| sit-up          | Sit-up          | `VIZX2Ru9qU8` | The AbMat Sit-Up — CrossFit oficial                   |
| ghd-sit-up      | GHD Sit-up      | `1pbZ8mX2D1U` | The GHD Sit-up — Julie Foucher, CrossFit oficial      |
| sled-push       | Sled Push       | `F7otn_5JdqA` | Sled Push — CrossFit Invictus                         |
| sled-pull       | Sled Pull       | `cy1gCkC6InY` | Equipment Demo — Westside/Dog Sled Push Pull, Rogue   |
| devils-press    | Devil's Press   | `cBGQrgovLFM` | Devil Press Demo — How to do Devil Presses            |
| man-maker       | Man Maker       | `iMNnvhg1JcM` | Reebok CrossFit ONE — Man Maker oficial               |

Los 18 cargados al `seed-movements.ts` el 2026-05-05. Validación visual pendiente (smoke en `/atleta/movimientos/[slug]`).

## Auditoría de los 32 actuales

Marcar como `[OK]` o `[REVISAR]` después de abrir cada uno en navegador:

| Slug              | URL actual                                        | Estado      |
| ----------------- | ------------------------------------------------- | ----------- |
| thruster          | `embed/L219ltL15zk`                               | [ ]         |
| clean             | `embed/EKRiW9Yt3Ps`                               | [ ]         |
| snatch            | `embed/9xQp2sldyts`                               | [ ]         |
| clean-and-jerk    | `embed/5EiLkyeCGp8`                               | [ ]         |
| power-clean       | `embed/IwjMiEEtbMo`                               | [ ]         |
| dumbbell-snatch   | `embed/9rRMFYPdYhg`                               | [ ]         |
| turkish-get-up    | `embed/0bWRPC49-KI`                               | [ ]         |
| push-press        | `embed/iaBVSJm78ko`                               | [ ]         |
| push-jerk         | `embed/V-hKuAfWNUw`                               | [ ]         |
| deadlift          | `embed/op9kVnSso6Q`                               | [ ]         |
| back-squat        | `embed/ultWZbUMPL8`                               | [ ]         |
| front-squat       | `embed/uYumuL_G_V0`                               | [ ]         |
| overhead-squat    | `embed/RD_vUnqwqqI`                               | [ ]         |
| bench-press       | `embed/vcBig73ojpE`                               | [ ]         |
| strict-press      | `embed/2yjwXTZQDDI`                               | [ ]         |
| pull-up           | `embed/eGo4IYlbE5g`                               | [ ]         |
| kipping-pull-up   | `embed/JrHciIJQMBQ`                               | [ ]         |
| chest-to-bar      | `embed/MzmJmRGFVDo`                               | [ ]         |
| muscle-up-ring    | `embed/6nQu-Y8Plbk`                               | [ ]         |
| muscle-up-bar     | `embed/P099n4qjKy0`                               | [ ]         |
| bar-muscle-up     | `embed/P099n4qjKy0` (DUPLICADO con muscle-up-bar) | [ REVISAR ] |
| toes-to-bar       | `embed/_03pCKOv4l4`                               | [ ]         |
| handstand-push-up | `embed/IHGhp3pW6FE`                               | [ ]         |
| ring-dip          | `embed/YFimRjwqCH8`                               | [ ]         |
| rope-climb        | `embed/E2hWMlqxBaw`                               | [ ]         |
| pistol-squat      | `embed/vq5-vdgJc0I`                               | [ ]         |
| row               | `embed/zQ82RYIFLN4`                               | [ ]         |
| double-under      | `embed/82IdFQ9BmWw`                               | [ ]         |
| air-squat         | `embed/C_VtOYc6j5c`                               | [ ]         |
| push-up           | `embed/IODxDxX7oi4`                               | [ ]         |
| burpee            | `embed/dZgVxmf6jkA`                               | [ ]         |
| box-jump          | `embed/52r_Ul5k03g`                               | [ ]         |
| wall-ball         | `embed/fpUD0mcFp_0`                               | [ ]         |
| kettlebell-swing  | `embed/YSxHifyI6s8`                               | [ ]         |

**Bug detectado**: `muscle-up-bar` y `bar-muscle-up` apuntan al mismo `embed/P099n4qjKy0`. Uno de los dos debe cambiar — son movimientos distintos (muscle-up-bar es synonym de bar-muscle-up; revisar slugs duplicados también).

## Próximos pasos (cuando Samuel decida)

1. Validar los 32 actuales (Samuel abre `/admin/movimientos` y marca OK/REVISAR)
2. Resolver duplicado bar-muscle-up vs muscle-up-bar (¿son el mismo o son 2 distintos?)
3. Buscar los 18 faltantes (con WebSearch o curaduría manual)
4. Editar `prisma/seed-movements.ts` con todas las URLs finales
5. `pnpm db:seed`
6. Smoke en `/atleta/movimientos/[id]` y `/admin/movimientos`
