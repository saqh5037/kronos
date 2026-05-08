# Kronos — Brief de Copy para Landing Pública

> **Para:** copywriter externo (Gemini, Claude Web, o quien recibas).
> **Output esperado:** copy refinado por sección, listo para portar a JSX.
> **Última actualización:** 2026-05-08

---

## TL;DR (el copywriter solo necesita leer esto si tiene 30 segundos)

**Kronos es un SaaS multi-tenant que opera CrossFit Boxes bajo la marca del Box, no la nuestra.** Reservas, WODs, pagos, racha — todo en una app/admin que el Box pone en su dominio, con su logo, su color. El atleta nunca lee "Kronos" en pantalla.

**Audiencia primaria del copy:** dueños/operadores de Boxes en LATAM (MX · CO · PE base, expansible) que están cansados de Wodify/Triib/MyFitnessPal-style: feos, gringos, lentos, con el logo del proveedor en cada pantalla.

**Diferenciador único:** white-label real (no skin) + UX que no se siente como "software de gimnasio" + multi-tenant que permite a un atleta entrenar en 3 Boxes con una sola racha.

**Tono:** editorial-premium con punch · voseo MX/LATAM · verbos sobre adjetivos · números sobre vaguedad · cero bullshit motivacional crossfit.

**Estado del producto:** Fase 1 cerrada (admin + atleta funcional end-to-end). Sweep visual V3 "Cuarto Oscuro" cerrado (paleta lima neon `#C8FF2D`). Listo para vender.

---

## 1. Qué es Kronos (la verdad del producto)

### Lo que es

- **El sistema operativo del Box**: reservas, WODs, asistencia, PRs, leaderboards, pagos (Stripe + Mercado Pago), comunicaciones.
- **Multi-tenant real**: un atleta puede entrenar en N Boxes — cada Box ve solo a sus atletas, el atleta ve la app correcta en cada momento.
- **White-label**: el Box configura su `nombre`, `logo`, `color brand`, `dominio` (`iron-hands.app`), `paleta` — todo se aplica automáticamente.
- **App del atleta** (mobile web/PWA): hero racha, WOD del día, reservas 1-tap, PRs, perfil.
- **Admin del owner/coach**: dashboard con MRR/churn/ocupación, programación de clases, biblioteca de WODs, gestión de atletas, pagos.
- **Operativa real**: emails Resend, cron jobs, notificaciones push, billing automatizado.

### Lo que NO es

- ❌ NO es una "red social fitness" (no hay feed, no hay likes, no hay seguir).
- ❌ NO es "tracking de fitness genérico" (no compite con MyFitnessPal/Strong/Hevy — somos B2B Box, no B2C consumer).
- ❌ NO es "un sistema de programación" pelado (Beyond the Whiteboard, SugarWOD) — eso es 1/10 de lo que hacemos.
- ❌ NO es "Wodify pero más barato" — es Wodify pero **bajo TU marca**, con UX 2026, y sin el logo del proveedor.
- ❌ NO usamos buzzwords vacías ("AI-powered", "blockchain fitness", "metaverse training"). El producto tiene la potencia sin teatro.

### Diferenciador único — la frase de 1 línea

> **"Kronos opera tu Box. Tu Box es tuyo."**
>
> Software invisible: el atleta nunca ve nuestro logo, solo el del Box. La app que el Box les pasa lleva el nombre del Box, el color del Box, en el dominio del Box.

### Por qué importa esto al owner del Box

1. **Retención**: si el atleta asocia la app con tu Box (no con un proveedor gringo), el costo de switching aumenta.
2. **Brand equity**: el Box construye marca, no rentamos brand para Kronos.
3. **Pricing power**: poder mostrar "tu app, en tu dominio" justifica membresía premium frente a Boxes que usan Wodify.
4. **Decisión de no-renovar**: si en 2 años el Box se cambia a otro provider, el atleta no nota — sigue siendo "la app de Iron Hands".

---

## 2. Audiencias (3 niveles, copy debe servir a los 3)

### A. Owner / dueño operativo (decisor de compra) ★ PRIMARIO

- Edad 28–48, ex-atleta high-level o emprendedor fitness.
- Operó 1–5 años con Wodify/Triib/Excel/WhatsApp y se cansó.
- Métricas que le importan: MRR, churn, atletas en riesgo, ocupación por hora, costo por atleta.
- Dolores: software feo que no se puede personalizar, dependencia del proveedor para reportes básicos, atletas que se van sin warning, cobranza manual.
- Vocabulario: "márgenes", "churn", "membresía", "punto de equilibrio", "ocupación", "no-show", "drop-out".

### B. Coach / Staff (usuario operativo, influencia compra)

- Edad 24–40, certificación L1/L2 CrossFit, programa WODs, da clases.
- Necesita: subir WODs rápido, ver quién reservó, marcar asistencia, registrar PRs en clase.
- Dolores: software tedioso para hacer lo simple (programar 1 clase = 12 clicks), no poder ver qué hizo el atleta antes.
- No decide compra pero su queja en clase puede tirar el contrato.

### C. Atleta (usuario final, NO compra)

- Edad 22–55, va al Box 3–6 veces/semana.
- Quiere: ver el WOD de hoy, reservar próxima clase, ver su PR, sentir que progresa.
- NO quiere: notificaciones basura, gamificación cringe, comparar con extraños, descargar 3 apps distintas.
- Importa para el copy porque el owner decide en parte por la experiencia que va a dar a sus atletas.

---

## 3. Posicionamiento vs competencia

| Competidor                         | Su pitch                            | Por qué Kronos gana                                                                      |
| ---------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------- |
| **Wodify**                         | "Manage your gym, all in one."      | Su admin es feo · setup pesado · branding del proveedor en la app del atleta · gringo $$ |
| **Triib**                          | "The all-in-one platform for gyms." | UX lenta · diseño 2018 · poca personalización white-label real                           |
| **PushPress**                      | "Member-first gym management."      | Bueno en USA pero costo en LATAM duele · branding limitado                               |
| **SugarWOD**                       | "Train together. Every day."        | Solo programación, no es admin completo · enfoque feed social que muchos owners odian    |
| **MyFitnessApp / GymGo / locales** | varios                              | Suelen ser builds amateur · sin multi-tenant real · sin retention engine                 |

### Tagline candidatos (ordenados por punch)

1. **"Tu Box, nuestro motor."** ← actual, ya brand-recognized en mockups
2. **"Operamos tu Box. Tu Box es tuyo."**
3. **"Software invisible para CrossFit Boxes."**
4. **"El sistema operativo del Box moderno."**
5. **"Tu marca arriba. Nuestro motor abajo."**

---

## 4. Tono y voz

### Reglas duras

- **Voseo argentino/MX**: "reservás", "rompés", "pagás", "tenés". (no "reservas tú", no "reservas usted").
- **Verbos sobre adjetivos**: "Reservás en 1 tap" > "Reservas fáciles y rápidas".
- **Números sobre vaguedad**: "23 días de racha" > "una buena racha". "11:42 (su PR)" > "su mejor tiempo".
- **Drama de fricción → alivio**: implicar el dolor sin escupirlo. "Pagos sin perseguir" implica el dolor de perseguir cobranza.
- **Cero bullshit motivacional**: NO "rompé tus límites", NO "dale con todo", NO "100% del esfuerzo, 0% de excusas". Eso es cringe en 2026.
- **Cero buzzwords tech**: NO "AI-powered", NO "blockchain", NO "next-gen", NO "revolutionary". Decir lo que hace.
- **Specific over generic**: si decís "muchos atletas", reemplazar por "412 atletas". Si no tenés el número, no lo digas.

### Reglas blandas (preferencias)

- Frases cortas. 1 idea por frase. Punto.
- Permitir ironías o doble lectura ("Operamos tu Box. No te operamos."). Funciona en headers, no en body.
- Permitir lenguaje técnico cuando aporta credibilidad (MRR, churn, multi-tenant, RFT, EMOM, AMRAP, RX, scaled).
- Tutear a coaches y atletas en copy del producto. Vosear al owner en marketing (más adulto, transmite respeto).
- Evitar emojis en copy formal. OK en notificaciones de la app.

### Palabras prohibidas

- "Revoluciona", "transforma", "lleva al siguiente nivel", "sin precedentes", "innovador" (vacíos).
- "Solución" (suena B2B 2010). Decir "sistema", "motor", "app", "admin".
- "Optimiza" (vacío). Decir qué optimiza.
- "Comunidad" (sobre-usado en fitness). OK si lo definís: "tu comunidad de 412 atletas".
- "Box" en inglés con mayúscula está OK (es el término que usan owners en LATAM).

### Vocabulario brand

- **Box** (no "gimnasio", no "centro").
- **Atleta** (no "miembro", no "cliente", no "usuario").
- **WOD** (workout of the day — nunca expandir, todos lo conocen).
- **PR** (personal record).
- **RX/scaled** (modalidad del WOD).
- **Racha** (no "streak", no "secuencia"). Es el feature halo de la app.
- **Coach** (no "instructor", no "entrenador").

---

## 5. Sistema visual (para que el copywriter entienda el container del copy)

### Paleta — V3 "Cuarto Oscuro"

- **Fondo:** negros estratificados (`#08080A` base, `#0F1014` cards, `#14141A` elevated).
- **Acento único:** lima neon `#C8FF2D` (sobreescribible por Box: cada Box define SU color).
- **Texto:** blanco off `#F5F5F7` primary, gris claro `#8A8A94` body, gris medio `#54545C` caption.
- **Sin gradientes coloridos**, sin azules cyan, sin naranjas warning. Monocromático lima.

### Tipografía

- **Display:** IBM Plex Mono 700, letter-spacing −0.04em (números, headlines, eyebrow).
- **Body:** Inter 400/500/600 (párrafos, captions cuando aplique).
- Estética: editorial técnica · brutalista digital · NO sports-app cliché.

### Voz visual del sistema

- Eyebrow `/01 · NOMBRE SECCIÓN` con dot lima glow al inicio.
- Headlines balanceadas (text-balance) sin overflow.
- Pricing cards con borde lima en featured + shadow lima sutil.
- Phone mockup en hero muestra HERO RACHA (23 días) — el feature halo del producto atleta.
- Charts con barras lima sólidas (sin gradientes).

### Lo que NO encaja con la estética

- Stock photos cheesy de "atletas felices saltando".
- Iconos coloridos.
- Gradientes purple/pink.
- Sombras pronunciadas tipo material design.
- Fotos con filtros saturados.

(Las únicas fotos en la landing son **duotone lima/black**, intensidad ambient — gym shots que dan textura sin distraer.)

---

## 6. Estado actual del producto (qué está cableado, qué no)

### ✅ Funcional end-to-end

- Auth: magic link email + Google OAuth + dev login.
- Multi-tenancy con `withTenant()` AsyncLocalStorage.
- Atleta: home con HaloRing (racha + asistencia + PRs), WOD del día, reservar (calendario 7 días), perfil con PRs e historial, leaderboard, logros con engine de achievements.
- Admin: dashboard con KPIs día, atletas CRM, programación con recurrencia, WODs builder + biblioteca movimientos, reservas con waitlist + check-in + no-show, asistencia, PRs agrupados, leaderboards, pagos, comunicaciones (announcements con cron dispatch), reportes, ajustes del Box.
- White-label real: Box configura nombre/slug/brandColor/logo/locale/currency/timezone/capacity.
- Roles: OWNER, COACH, STAFF, ATHLETE (middleware enforced).
- Pagos: Stripe + Mercado Pago integration con webhooks.
- Email: Resend en prod, mock en dev.
- Cron: 5 cron jobs (announcements dispatch, achievements backfill, owner digest semanal, billing lifecycle, cleanup uploads).
- Tests: 719/719 pasando · build prod OK · typecheck OK · lint OK.

### 🟡 En proceso / parcial

- SaaS billing real para los Boxes que pagan a Kronos (mock mode + escritorio de auto-renovación).
- Multi-tenant cross-Box switcher para atletas (un atleta en N Boxes) — sketcheado en mock, no full prod.
- API pública + webhooks para clientes Franquicia.

### ❌ Aún no

- App nativa iOS/Android (PWA hoy — válido pero no equiv).
- BI consolidado para grupos multi-sede.
- SSO federado (SAML/OIDC).
- Onboarding guiado para owner (wizard).

### Métricas reales del producto (NO mostrar como producción todavía)

- Boxes operando: **mock 47** — real probablemente <5 piloto.
- Atletas activos: **mock 8.4K** — real <500.
- Países: **MX · CO · PE** declarado en footer (real: piloto MX).
- Uptime 90d: **mock 99.98%** — instrumentación Sentry+PostHog está, métrica real no publicada.

⚠️ El copywriter debe **NO inventar métricas**. Si un número no se puede defender, va con label "objetivo" o se omite hasta tener real.

---

## 7. Estructura de la landing — qué tiene que comunicar cada sección

> Esta es la spine narrativa. El copywriter debe respetar el orden y propósito de cada sección. El copy concreto es lo que reescribe.

### 0. Nav (top fijo)

- Logo Kronos (mark lima + wordmark Plex Mono).
- Links: Producto · Para Boxes · Para atletas · Precios.
- CTA secundario: Entrar (login).
- CTA primario: Registrate gratis (signup).

**Objetivo:** orientación + call to action permanente.

### 1. Hero (above the fold)

**Objetivo:** en 5 segundos el visitante entiende QUÉ es Kronos, PARA QUIÉN, y POR QUÉ es distinto.
**Elementos:**

- Eyebrow corto (5–8 palabras, mono uppercase): posicionamiento.
- H1 grande (2–6 palabras): hook de valor.
- Lead (2–4 frases): qué hace + diferenciador + para quién.
- 2 CTAs: primario lima ("Registrate gratis" / "Empezar 30 días gratis"), secundario ghost ("Ver el admin · 90 seg" / video corto).
- Meta strip: 3–4 stats con números (BOXES OPERANDO · ATLETAS ACTIVOS · PAÍSES · UPTIME).
- Visual: phone mockup mostrando la app del atleta (HERO RACHA 23 días con grid de 14 celdas).

### 2. Strip de social proof

**Objetivo:** mostrar tracción · "no soy el primero".

- Label: "OPERAN BAJO KRONOS · " + dot lima.
- 6 logos (texto, no SVG) de boxes piloto.

### 3. Sección /01 — Para el atleta

**Objetivo:** mostrar que la app del atleta es premium · sin gamificación cringe · que el Box queda como héroe.
**Elementos:**

- Eyebrow: `/01 · PARA EL ATLETA`.
- H2: hook de UX ("La app que no se siente como app").
- Párrafo intro (3–4 frases).
- Lista de 4 features con título corto + descripción específica.
- Visual: card preview de "multi-box switching" mostrando 1 atleta en 3 Boxes con la misma racha.

### 4. Sección /02 — Para el owner

**Objetivo:** mostrar que el admin habla en MRR/churn/ROI · NO es "dashboard bonito sin valor".
**Elementos:**

- Eyebrow: `/02 · PARA EL OWNER`.
- H2: hook de gestión ("Tu Box, en cifras frías").
- Párrafo intro.
- 4 features con ROI específico.
- CTA secundario inline: "Ver el admin completo →".
- Visual: dashboard mock con MRR/atletas/churn KPIs + chart ocupación 14 días.

### 5. Sección /03 — White-label architecture

**Objetivo:** explicar el diferenciador único de la forma más visual posible.
**Elementos:**

- Eyebrow: `/03 · WHITE-LABEL ARCHITECTURE`.
- H2: hook de marca ("Tu marca. No la nuestra").
- Párrafo intro.
- Visual: 4 paletas de Boxes ficticios (lima default, naranja brasa, cobalto, sangre).
- Nota técnica con `code` inline explicando contraste automático.

### 6. Sección /04 — Pricing

**Objetivo:** decisión clara · 3 opciones · empujar a PRO (featured).
**Elementos:**

- Eyebrow: `/04 · PRECIOS`.
- H2: hook de modelo ("Por atleta activo. Sin setup fee").
- Sub-párrafo aclarando trial / sin contrato / pricing dinámico.
- 3 cards: START (entry) / PRO ★ RECOMENDADO (featured con borde lima) / FRANQUICIA (custom enterprise).
- Cada card: nombre, precio + unidad, descripción, lista de features con `+` lima, CTA.

⚠️ **Decisión pendiente:** moneda. Hoy USD. Opciones: MXN ($59/$99), ARS ($3.500/$5.900), multi-currency con switcher, USD aumentado ($4/$7). **El copywriter debe trabajar con placeholders y dejarlo abierto para Samuel decida.**

### 7. CTA tail

**Objetivo:** último empujón antes del footer · cerrar con garantía.
**Elementos:**

- Eyebrow corto con condiciones ("30 DÍAS · SIN TARJETA · SIN CONTRATO").
- H2 emotivo ("¿Listo para que tu Box tenga voz propia?").
- Párrafo con onboarding + garantía explícita ("si no te convence te exportamos todo en CSV y nos vamos en buenos términos").
- 2 CTAs: lime primario ("Probar 30 días gratis") + ghost secundario ("Agendar demo · 20 min").

### 8. Footer

- Lockup + tagline corto (1 frase) + caption operacional (`v1.0 · MX · CO · PE`).
- 3 columnas de links: Producto / Empresa / Recursos.
- Foot-bottom: copyright + términos/privacidad/SLA + tagline final ("BUILT FOR BOXES").

---

## 8. Copy actual (baseline · refinado en última iteración)

> Este es el copy que está en código HOY. El copywriter puede refinarlo, no tiene que partir de cero. Mantener la spine narrativa, mejorar el filo.

### Hero

```
EYEBROW: OPERAMOS DETRÁS · TU MARCA AL FRENTE
H1:      Tu Box, nuestro motor.
LEAD:    Reservas en 1 tap. WODs sincronizados. Pagos sin perseguir.
         Una racha que tus atletas no van a querer romper. Todo bajo
         tu marca, en tu dominio. Operamos detrás — el atleta nunca
         lee "Kronos" en pantalla.
CTA 1:   Empezar 30 días gratis →
CTA 2:   Ver el admin · 90 seg
META:    47 BOXES OPERANDO · 8.4K ATLETAS ACTIVOS · 3 PAÍSES · 99.98% UPTIME 90D
```

### Sección /01 — Atleta

```
EYEBROW: /01 · PARA EL ATLETA
H2:      La app que no se siente como app.
P:       Sin notificaciones basura. Sin gamificación barata. Sin el
         logo de un proveedor gringo. Una pantalla con lo que importa:
         el WOD de hoy, la próxima clase, y la racha que está construyendo.

FEATURES:
- 23 días de racha
  El número más grande de la app. Si lo rompe, lo ve antes que nada.
  Si lo extiende, lo siente todo el día.
- Helen · 11:42 (su PR)
  El WOD del día contra su mejor marca. Compara contra sí mismo,
  no contra el feed.
- Reserva en 1 tap, no en 4 menús
  CTA primaria de 54px, en la marca de tu Box. Cero fricción,
  cero ambigüedad.
- Tu Box, no nosotros
  Logo, nombre, color, dominio — todo del Box. Operamos detrás
  como un sistema operativo.

CARD PREVIEW HEADER: PREVIEW · MULTI-BOX SWITCHING
CARD STORY:          Carlos entrena Iron Hands de lunes a miércoles,
                     Califa los jueves en Bogotá, y Alpha Box los
                     fines en Lima. Cada Box ve solo a sus atletas —
                     Carlos ve la app correcta en cada ciudad. Mismo
                     motor, tres marcas, una racha.
CARD FOOTER:         RACHA UNIFICADA · 23 días · 3 boxes
```

### Sección /02 — Owner

```
EYEBROW: /02 · PARA EL OWNER
H2:      Tu Box, en cifras frías.
P:       Un panel que tu CFO entiende y tu coach principal abre cada
         mañana. Sin gráficos decorativos, sin métricas de vanity.
         Las cifras que mueven dinero, en una sola pantalla.

FEATURES:
- MRR, churn, CAC, LTV
  Las 4 métricas que importan, listas para tu junta mensual.
  Sin armar Excel, sin pedirle al contador.
- Ocupación por hora del día
  Sabés qué clase mover y qué coach reforzar. Decisiones de
  programación basadas en data, no en intuición.
- Atletas en riesgo, antes que se vayan
  Quién dejó de venir 14 días. Quién bajó intensidad. Quién
  vence membresía esta semana. Acción antes del churn.
- Pagos sin perseguir
  Stripe, Mercado Pago, OXXO, transferencia. Recordatorios
  automáticos. Reportes de cobranza sin abrir Excel.

CTA INLINE: Ver el admin completo →

DASHBOARD HEADER: ADMIN · IRON HANDS · MAYO 2026
KPIS:             MRR $184K (↑ 12% MoM) · 412 atletas (↑ 28 neto) · 3.1% churn (−0.4% MoM)
CHART LABEL:      OCUPACIÓN · ÚLTIMOS 14 DÍAS · PROMEDIO 78%
```

### Sección /03 — White-label

```
EYEBROW: /03 · WHITE-LABEL ARCHITECTURE
H2:      Tu marca. No la nuestra.
P:       Cada Box define un solo color: el de su marca. Es la única
         variable visual del sistema — toca 4 superficies (CTA, hero,
         tab activo, dot de estado). El resto vive en negros
         estratificados: agnóstico, atemporal, brutalmente consistente.

PALETAS:
- Lima Neon · #C8FF2D · Califa · BOG ★ DEFAULT
- Naranja Brasa · #FF5A1F · Iron Hands · MX
- Cobalto · #6B89FF · Alpha Box · LIM
- Sangre · #E84545 · Húsares · MX

NOTA TÉCNICA: Pegás el #hex de tu marca, nosotros calculamos contraste
automático sobre cada superficie. Lima → texto negro. Brasa → texto
blanco. Cero ajuste manual. Cualquier hex válido funciona.
```

### Sección /04 — Pricing

```
EYEBROW: /04 · PRECIOS
H2:      Por atleta activo. Sin setup fee.
SUB:     30 días gratis. Sin tarjeta. Sin contrato anual. Si tu Box
         crece, el plan se ajusta solo. Si decrece, también — pagás
         solo por atleta activo del mes.

CARD START:
  Nombre:  START
  Precio:  $3 USD / atleta activo · mes  (DECISIÓN PENDIENTE: moneda)
  Desc:    El motor base. Para Boxes hasta 80 atletas que quieren
           operar pro sin pagar de más.
  Features:
    + App del atleta · iOS + Android
    + Reservas + waitlist FIFO
    + WOD del día + benchmarks (Helen, Murph, Fran)
    + Cobros: Stripe + Mercado Pago
    + Hero racha + PRs por movimiento
    + Soporte email · respuesta en 48h
  CTA:     Empezar gratis →

CARD PRO ★ RECOMENDADO:
  Nombre:  PRO ★
  Precio:  $5 USD / atleta activo · mes
  Desc:    Tu marca arriba, nuestro motor abajo. Para Boxes que ya
           escalaron y necesitan dejar de perder atletas.
  Features:
    + Todo del Start, más:
    + White-label · tu marca, tu dominio
    + Admin dashboard · MRR, churn, atletas en riesgo
    + Multi-coach + nómina automática
    + Programación de bloques · 12 semanas
    + Soporte WhatsApp · 4h hábiles
  CTA:     Probar 30 días gratis →

CARD FRANQUICIA:
  Nombre:  FRANQUICIA
  Precio:  $$ Pricing por sede
  Desc:    Para grupos con 5+ ubicaciones. Un atleta, varias ciudades,
           una sola racha.
  Features:
    + Multi-tenant real · switcher entre Boxes
    + BI consolidado · todas las sedes
    + API + webhooks
    + SSO · auth federada con tu IdP
    + Onboarding presencial en sede
    + SLA 99.99% · soporte 24/7
  CTA:     Hablar con ventas →
```

### CTA Tail

```
EYEBROW:  30 DÍAS · SIN TARJETA · SIN CONTRATO
H2:       ¿Listo para que tu Box tenga voz propia?
P:        Onboarding en 72 horas. Migramos tus reservas, atletas y
          pagos sin que pierdas un día de operación. Si en 30 días
          no te convence, te exportamos todo en CSV y nos vamos en
          buenos términos.

CTA 1:    Probar 30 días gratis →
CTA 2:    Agendar demo · 20 min
DISCLAIM: SIN TARJETA · CANCELA CUANDO QUIERAS
```

### Footer

```
BRAND:     [Lockup KRONOS]
           Software invisible para CrossFit Boxes. Operamos detrás
           de tu marca, en tu dominio, con tu paleta.
STATUS:    · v1.0 · MX · CO · PE

COL 1 (Producto):
  - App atleta
  - Admin Box
  - Multi-tenant
  - Pagos
  - Programación

COL 2 (Empresa):
  - Sobre Kronos
  - Casos · Boxes
  - Trabaja con nosotros
  - Prensa

COL 3 (Recursos):
  - Documentación
  - API · webhooks
  - Status · 99.98%
  - Changelog
  - Soporte

FOOT-BOTTOM:
  © 2026 KRONOS · CDMX
  · TÉRMINOS · PRIVACIDAD · SLA ·
  BUILT FOR BOXES
```

---

## 9. Decisiones de copy pendientes (que el copywriter debe respetar como abierto)

1. **Moneda del pricing**: USD vs MXN vs ARS vs multi-moneda con switcher. ⚠️ Crítica.
2. **Tagline definitivo**: ¿"Tu Box, nuestro motor."? ¿O alternativa más punchy del shortlist?
3. **Boxes piloto reales**: hoy son mock (Iron Hands, Califa, etc.). Reemplazar con piloto real cuando exista.
4. **Métricas hero meta**: 47 boxes / 8.4K atletas son mock. Decidir si mostrar reales pequeños (más honesto) o mantener mock pre-launch.
5. **Garantía CSV en CTA tail**: ¿es defendible legalmente? Si SÍ es política de la compañía, dejarla. Si no, suavizar.
6. **Nombres de planes**: Start / Pro / Franquicia. ¿Mejores opciones? Ej: Garage / Box / Grupo. ¿Athlete / Studio / Federation?

---

## 10. Restricciones legales y técnicas (claims que NO podemos hacer)

- ❌ "El más rápido del mercado" sin estudio.
- ❌ "Único en LATAM" — Wodify y Triib operan acá.
- ❌ "Garantizamos 0% churn" / "tu Box crecerá X%" — no podemos prometer outcomes de negocio.
- ❌ "SOC2 / ISO 27001 certified" — no estamos. Decir "encriptación end-to-end" si aplica al data layer.
- ❌ Comparaciones nominales con competencia ("mejor que Wodify") — riesgo legal.
- ✅ "Software invisible bajo tu marca" — defendible: es nuestra arquitectura.
- ✅ "30 días sin tarjeta" — defendible si lo cumplimos.
- ✅ Métricas con label "objetivo" o "mock" si son piloto.

---

## 11. Brief específico para el copywriter

### Lo que esperás de él/ella

**Output 1 — Refinamiento de copy actual (mínimo viable):**

- Releer cada sección.
- Mantener spine narrativa (orden + propósito).
- Refinar headlines, leads, descripciones de features. Más punch sin perder claridad.
- Proponer 3 alternativas para H1 hero + 3 alternativas para tagline footer.
- Marcar con `[OPCIONAL]` lo que considere mejora pero no esencial.

**Output 2 — Variantes A/B (si tiene capacidad):**

- 1 variante "más editorial premium" (tono actual).
- 1 variante "más bro-CrossFit directa" ("dejá de pagarle a un proveedor gringo").
- 1 variante "más data-driven" (más cifras, más referencia técnica).

**Output 3 — Decisiones pendientes (Sec 9):**

- Recomendación con razón corta para cada decisión abierta.

### Formato esperado del output

```markdown
## Hero

### H1

- Variante A: ...
- Variante B: ...
- Variante C: ...

### Lead

[copy]

### CTAs

- Primario: ...
- Secundario: ...

## Sección /01 ...
```

### Restricciones operativas

- Output en **español MX/LATAM** (voseo).
- Cero emojis en headers/copy.
- Cero hashtags.
- Cero "click here" / "haz clic aquí" — los CTAs son acciones específicas.
- Cuando proponga cambio mayor, justificar en 1 línea ("cambié X por Y porque…").

### Lo que NO esperás de él/ella

- Cambiar la spine narrativa de la landing.
- Cambiar el sistema visual.
- Tocar los nombres de features del producto (HERO RACHA, multi-tenant, white-label) — son brand language asentado.
- Inventar features que no existen.
- Inventar números/métricas que no se puedan defender.

---

## 12. Apéndice — Stack técnico (por si el copywriter pregunta)

- **Frontend:** Next.js 15 App Router + TypeScript strict + Tailwind 3 + Framer Motion 11.
- **Backend:** Prisma 6 + PostgreSQL + NextAuth 4 (JWT).
- **Hosting:** Vercel (probablemente) + cron Vercel.
- **Pagos:** Stripe + Mercado Pago (preapproval flow).
- **Email:** Resend.
- **Monitoring:** Sentry + PostHog.
- **Multi-tenancy:** AsyncLocalStorage + `withTenant()` extension de Prisma.

---

## 13. Apéndice — Mockups y referencias

- **Bundle visual aprobado:** `~/Downloads/Kronos - Identidad + Landing (bundle-src).html` — sistema visual + landing aplicada en HTML estático. Referencia única de verdad para layout y voz.
- **Brand manual:** `proj.kronos.v3_sweep_total` (Engram memory) — sweep V3 cerrado · paleta lima neon · Plex Mono + Inter · dark-only forzado.
- **Plan de implementación:** `~/.claude/plans/golden-skipping-cray.md` — qué se hizo, archivos tocados, decisiones tomadas.

---

**FIN DEL BRIEF.**

> Cuando vuelvas con el copy refinado de Gemini/Claude Web, lo porto directo a JSX en los componentes de `src/app/(landing)/_components/*` y a `_data/mock.ts`. Tiempo estimado de aplicación: ~10 turnos · 30 min LLM.
