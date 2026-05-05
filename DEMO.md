# Kronos · Guía de Demo para Dueño Piloto

Demo de 15 minutos. Muestra los **3 pilares de diferenciación** vivos: confianza del dueño, OCR de pizarra, atleta sin fricción.

## Pre-demo (una sola vez, ~5 min)

### 1. Arrancar la BD y seed

```bash
docker compose up -d db
pnpm db:push
pnpm db:seed
```

Crea 2 boxes demo con 50 atletas, 120 clases, 650 scores históricos, 161 PRs, 52 movimientos estándar con video, 2 surveys (READINESS + RPE), permisos default y 3 reglas de alerta.

### 2. Configurar tokens (todos opcionales para demo básica)

`.env.local`:

```bash
# Storage para fotos de pizarra
STORAGE_DRIVER="local"               # local = filesystem (default, gratis)
# Para producción con AWS S3:
# STORAGE_DRIVER="s3"
# AWS_S3_BUCKET="kronos-uploads"
# AWS_S3_REGION="us-east-1"
# AWS_ACCESS_KEY_ID="..."
# AWS_SECRET_ACCESS_KEY="..."

# OCR Vision (Gemini 2.0 Flash) — sin esto el wizard no procesa fotos
GEMINI_API_KEY="AIzaSy..."           # https://aistudio.google.com/app/apikey

# Web Push (PWA notifications)
VAPID_PUBLIC_KEY="..."               # generar con: npx web-push generate-vapid-keys
VAPID_PRIVATE_KEY="..."
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."   # mismo valor que VAPID_PUBLIC_KEY
VAPID_SUBJECT="mailto:hola@kronos.app"

# Cron secret para limpiar fotos > 7 días
CRON_SECRET="dev-secret"
```

### 3. Arrancar el dev server

```bash
pnpm dev
```

Abrir http://localhost:3000

---

## Demo (15 min)

### Logins demo

Todos password `dev`:

| Rol    | Email                    | Para qué surface                |
| ------ | ------------------------ | ------------------------------- |
| OWNER  | `owner@iron-hands.demo`  | Confianza · auditoría · ajustes |
| COACH  | `coach@iron-hands.demo`  | OCR pizarra · day-of operations |
| ATLETA | `atleta@iron-hands.demo` | Experiencia atleta · PWA        |

---

### PILAR 1 · Confianza del dueño (5 min)

**Login: OWNER** (`owner@iron-hands.demo`)

#### 1.1 — "Cero fraude, control total"

> _"Imagina que descubres que tu coach está cobrando en cash y no registra. O regalando descuentos a sus cuates. Aquí lo ves todo, en tiempo real."_

1. Ir a **`/admin/auditoria`** (en sidebar, badge rojo si hay eventos sensibles hoy)
2. Mostrar timeline tipo Slack:
   - Iconos por tipo (💰 cash, ✂️ descuento, ↩️ refund, 🏋️ score)
   - Severity coloreada: gris (info), amarillo (warning), rojo (sensitive)
   - Filtros: por actor, por tipo, por hora
3. **Punch line**: _"Nada se mueve sin quedar grabado, con quién, cuándo, cuánto."_

#### 1.2 — "Tú decides qué puede tocar cada quién"

1. Ir a **`/admin/ajustes/permisos`**
2. Mostrar la matriz: 8 acciones × 3 roles + threshold + aprobación dual
3. Demostración: desactivar `REFUND_PAYMENT` para COACH → guardar
4. Loguearse como COACH (`coach@iron-hands.demo`) → intentar refund → bloqueado o pasa a aprobación pendiente
5. **Punch line**: _"Algunos dueños quieren control absoluto, otros confían en su staff. Tú parametrizas."_

#### 1.3 — "Te aviso solo cuando importa"

1. Ir a **`/admin/ajustes/alertas`** (de vuelta como OWNER)
2. Mostrar las 3 reglas default: cash > $1,000, descuento > 20%, cualquier refund
3. Editar threshold, agregar canal PUSH (si tienes PWA + VAPID configurados)
4. **Punch line**: _"No spam. Solo lo que tú decides que vale tu atención."_

---

### PILAR 2 · OCR de pizarra (5 min) — **EL WOW MOMENT**

**Login: COACH** (`coach@iron-hands.demo`)

#### 2.1 — Setup (1 min)

> _"Hoy tu coach tiene que escribir manualmente los scores de 25 atletas en la app después de la clase. La realidad: nunca lo hace, los datos quedan incompletos, los atletas no ven progreso. Mira esto."_

1. Tener una foto real de pizarra de CrossFit a mano (o usar mock con nombres del seed: Carlos, María, Diego, Andrea, Roberto, etc.)
2. La pizarra debería tener formato:
   ```
   Carlos    5:43 RX
   María     6:12 RX
   Diego     7:30 SC
   Andrea    5:55 RX
   ```

#### 2.2 — Upload + OCR (2 min)

1. Ir a **`/admin/asistencia`** o `/admin/programacion` → click una clase de hoy
2. En la página de la clase: botón **"📸 Cargar scores de pizarra"**
3. **Step 1 — Upload**: tomar/cargar foto. Preview.
4. **Step 2 — Review**: tabla con resultados de Gemini
   - Match automático contra roster (verde >0.85, amarillo 0.5-0.85, rojo <0.5)
   - Coach ajusta los dudosos (dropdown atleta)
   - Si rectifica un nombre → prompt "¿Guardar 'Memo' como apodo de Guillermo?" → marca el alias
5. **Step 3 — Confirm**: bulk save. PR detection automática.
6. **Punch line**: _"30 segundos. Cero data entry. Todos los scores cargados, PRs detectados, atletas notificados."_

#### 2.3 — La cadena completa

1. Volver al feed `/admin/auditoria` como OWNER → ver el evento `BULK_SCORES_FROM_WHITEBOARD`
2. Login como ATLETA → ver el `🔔 NotificationBell` con "Tu score fue registrado"
3. **Punch line**: _"El dueño ve qué pasó, el atleta sabe que su esfuerzo quedó registrado. Cero esfuerzo manual."_

---

### PILAR 3 · Atleta sin fricción (5 min)

**Login: ATLETA** (`atleta@iron-hands.demo`)

#### 3.1 — Home con encuesta tap-friendly (1 min)

1. Ir a **`/atleta`**
2. Ver el `<QuickSurvey>` de READINESS arriba: 3 preguntas con emojis (😴😐💪)
3. Tap-tap-tap, total 5 segundos
4. **Punch line**: _"Sin texto. Sin formularios. 5 segundos al día."_

#### 3.2 — Biblioteca de movimientos (2 min)

1. Ir a **`/atleta/movimientos`**
2. Mostrar 52 movimientos categorizados (STRENGTH, GYMNASTICS, OLYMPIC, etc.)
3. Tap en `Thruster` → video YouTube embebido + descripción + tips
4. Volver y abrir el `WOD del día` (`/atleta/wod`) → en el cuerpo del WOD, los nombres de movimientos son links → tocar `thruster` inline → modal con video
5. **Punch line**: _"Atleta nuevo no tiene que preguntar al coach qué es un thruster. Lo ve, lo entiende, lo hace."_

#### 3.3 — PWA + Push (2 min)

1. En Chrome mobile o Edge: ver banner "Instalar Kronos como app"
2. Aceptar → la app aparece en home screen como nativa
3. En `/atleta/perfil`: botón "Activar notificaciones" → permitir
4. (Trigger desde admin: registrar un score, marcar PR, cancelar clase)
5. Push notification llega al celular en segundos
6. **Punch line**: _"Sin App Store. Sin descargar 80MB. Es web pero se siente como app nativa."_

---

## Cierre (1 min)

> _"Esto es lo que te diferencia: el dueño tiene control real sin ser controlador, los coaches no pierden tiempo en data entry, y los atletas se quedan porque la app no les estorba. Esto no lo tiene Wodify, no lo tiene SugarWOD, no lo tiene BTWB. Lo tienes tú."_

---

## Troubleshooting

| Síntoma                                           | Causa                                               | Fix                                               |
| ------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| OCR responde "GEMINI_API_KEY no configurado"      | Falta env                                           | Agregar a `.env.local` y reiniciar `pnpm dev`     |
| Push no llega                                     | VAPID keys no configuradas o atleta no se suscribió | Generar VAPID + activar notif en `/atleta/perfil` |
| Sidebar admin no muestra "Auditoría"              | Login no es OWNER                                   | Solo visible para OWNER (parametrizado)           |
| Foto sube pero el wizard se queda en "Procesando" | GEMINI_API_KEY inválida o rate-limited              | Revisar console log del server, probar otra key   |
| Demo se ve genérico                               | Falta seed                                          | `pnpm db:seed`                                    |

---

## Plug post-demo

> _"Si te late, podemos arrancar piloto contigo este mes. Datos importan: tu box, tus coaches, tus atletas. Si después de 30 días no es lo que esperabas, te exporto todo limpio en CSV/JSON, sin lock-in."_
