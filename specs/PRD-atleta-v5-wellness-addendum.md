# PRD V5 Addendum — Audiencia Wellness

> Addendum corto al PRD V4. Foco: reconocer al **atleta-wellness** como segmento de primera clase, no como caso edge del flujo competitivo.

## Contexto

PRD V4 ancló a Kronos como producto **vertical CrossFit competitivo** ("no somos wearable de recovery"). En la práctica, muchos atletas en boxes reales no buscan competir: buscan **salud, perder grasa, ganar músculo, moverse**. Para esa audiencia las metas técnicas (dominar muscle-up) no son su norte y el catálogo de Skills se siente ajeno.

V5 no rescribe V4 — agrega un eje paralelo: tracking de composición corporal con metas de peso/grasa, sin abandonar el corazón competitivo.

## Decisión: dos audiencias, un producto

| Eje              | Atleta competitivo (V4)          | Atleta wellness (V5)                         |
| ---------------- | -------------------------------- | -------------------------------------------- |
| Norte            | Mejorar skill / PR / leaderboard | Mejorar composición corporal / sentirse bien |
| Pantalla central | Skills, WOD, leaderboards        | Salud (tracking + metas BODY_COMPOSITION)    |
| Hero del Home    | Tu próxima victoria              | Tu cuerpo esta semana                        |
| Trofeo dominante | PR badge                         | Logro de % progreso wellness                 |

Un mismo atleta puede tener ambos tags activos — se respeta y se mezcla la presentación.

## Mecánica de detección

Tags en `Athlete.tags[]` con prefijo `goal:`:

- `goal:competitive` — quiero competir
- `goal:wellness` — quiero estar bien / salud
- `goal:weight_loss` — perder grasa
- `goal:muscle_gain` — ganar músculo
- `goal:recovery` — movimiento / recuperación

`isWellnessAudience(tags)` retorna **true** cuando hay al menos un tag wellness/weight_loss/muscle_gain **y no hay** `goal:competitive`. Atletas con ambos sets de tags se tratan como competitivos por defecto (V4 priority).

## Captura

1. **Signup**: paso opcional "¿Por qué entrenás?" después de nombre/apellido. Multi-select de chips. Saltable. No bloqueante.
2. **Perfil**: futuro slot para editar los mismos tags después.

## Posicionamiento (copy)

- ❌ "Kronos no es wearable de recovery."
- ✅ "Kronos lleva tu tracking manual junto al coach. Sin obsesión con dispositivos."

El producto mide **lo que el atleta y su coach acuerdan medir**, en una cadencia humana (semanal/mensual), no en stream de wearable.

## Slot en bottom nav

Reemplazo de `Movs` por `Salud` en posición 5:

```
ANTES:    Inicio · Reservar · Skills · WOD · Movs · Yo
DESPUÉS:  Inicio · Reservar · Skills · Salud · WOD · Yo
```

`Movs` queda en el `AthleteDrawer` (hamburger) — sigue accesible por URL y desde el drawer.

## Goal model

Nueva métrica `GoalMetric.BODY_COMPOSITION`:

- `targetValue` en kg (peso) o % (grasa)
- `startValue` autocaptura del último BodyMetric
- `deadline` definida por el atleta
- `unit ∈ {"kg", "%"}`
- `movementId` queda null (rechazado por schema)

Cálculo de progreso **dirección-aware** (helper `calcWellnessProgress`):

- Si `target < start` → descendente (pérdida).
- Si `target > start` → ascendente (ganancia).
- `pct` clampeado 0–100.
- `achieved` cuando el current cruza target en la dirección correspondiente.
- Auto-marca el goal como `ACHIEVED` al guardar un BodyMetric que cumple (hook idempotente en `createBodyMetric`).

## Captura por coach/admin

Permission nueva `MANAGE_ATHLETE_METRICS` (`OWNER, COACH` por default). Coach abre drawer de atleta en `/admin/atletas`, sección "Composición corporal", botón "Registrar". Modal reutilizado del lado atleta con `saveAction` apuntando a `createBodyMetricForAthlete` (autoriza tenant + role + permission).

## Privacy

BodyMetric es PII médica blanda. Se trata con el mismo cuidado que `Athlete.healthHistory`:

- No se loggea en analytics ni exports CSV por default.
- Solo el atleta + roles con `MANAGE_ATHLETE_METRICS` pueden leer/escribir mediciones de un tercero.
- Tenant isolation duro vía `withTenant`.

## Lo que NO está en V5

- Integración con wearable (Whoop, Oura, Garmin). Postergado a V6.
- Recomendaciones nutricionales / planes de comidas.
- Rol "Nutriólogo" dedicado — se reutiliza COACH/STAFF con la permission granular.
- Unidades alternativas (lbs/in). V1 fija kg/cm.
- Pliegues cutáneos, bioimpedancia, agua corporal. Opcional vía `CUSTOM`.

## Verificación

E2E críticos:

1. Atleta wellness signup → home muestra `WellnessHomeCard`.
2. Atleta loguea peso → aparece en `/atleta/salud` hero + chart.
3. Atleta crea goal BODY_COMPOSITION → barra progreso refleja último peso.
4. Coach mete medición desde `/admin/atletas` drawer → atleta la ve en su `/atleta/salud`.

Tests unit:

- `wellness-calculations.test.ts` (BMI, trend, direction-aware progress).
- `goals.test.ts` (validación schema BODY_COMPOSITION + unit kg/%).
- `body-metric.test.ts` (perímetros + altura).
- `fitness-goal-tags.test.ts` (parser/writer de tags `goal:*`).
