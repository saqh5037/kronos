# Inventario de Server Actions — Kronos

> Extracción de funciones exportadas en `src/server/actions/` y `src/server/analytics/` con firma, payload de ejemplo, visualización sugerida y ubicación en UI.

---

## `src/server/actions/types.ts`

| Función               | Firma                                                         | Payload ejemplo                                   | Visual | UI                          |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------- | ------ | --------------------------- |
| `normalizePagination` | `(opts?: {page?, pageSize?}) => {page, pageSize, skip, take}` | `{"page":1,"pageSize":25}`                        | None   | Helper interno (paginación) |
| `dateRangeFilter`     | `(dateFrom?, dateTo?) => {gte?, lte?} \| undefined`           | `{"dateFrom":"2024-01-01","dateTo":"2024-01-31"}` | None   | Helper interno (filtros)    |

---

## `src/server/actions/dashboard.ts`

| Función            | Firma                          | Payload ejemplo | Visual                                | UI                                  |
| ------------------ | ------------------------------ | --------------- | ------------------------------------- | ----------------------------------- |
| `getDashboardData` | `() => Promise<DashboardData>` | `{}`            | Card (KPIs) + Table (próximas clases) | `/admin/page.tsx` (Dashboard admin) |

**DashboardData keys:** todayStats, nextClasses, todayRevenue, todayPaymentsCount, expiringMemberships, waitlistedClassesToday.

---

## `src/server/actions/athletes.ts`

| Función                 | Firma                                                                     | Payload ejemplo                                                           | Visual                            | UI                                      |
| ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------- | --------------------------------------- |
| `listAthletes`          | `() => Promise<{id, firstName, lastName, status, phone, createdAt}[]>`    | `{}`                                                                      | Table                             | `/admin/atletas/page.tsx`               |
| `listAthletesPaged`     | `(opts?: ListOpts<AthleteSort>) => Promise<ListResult<AthleteRow>>`       | `{"page":1,"pageSize":25,"search":"Ana","sortBy":"name","sortDir":"asc"}` | Table                             | `/admin/atletas/page.tsx`               |
| `getAthleteGrowthByDay` | `(opts: {dateFrom: Date, dateTo: Date}) => Promise<AthleteGrowthPoint[]>` | `{"dateFrom":"2024-01-01","dateTo":"2024-01-31"}`                         | LineChart                         | `/admin/atletas/page.tsx` (GrowthChart) |
| `getAtRiskAthletes`     | `(opts?: {inactivityDays?, limit?}) => Promise<AtRiskAthlete[]>`          | `{"inactivityDays":14,"limit":50}`                                        | Table                             | `/admin/atletas/page.tsx`               |
| `getAthleteDetail`      | `(athleteId: string) => Promise<AthleteDetail \| null>`                   | `{"athleteId":"cm1abc..."}`                                               | Card (perfil) + Table (PRs/pagos) | `/admin/atletas/[id]/page.tsx`          |
| `updateAthleteStatus`   | `(athleteId: string, status: AthleteStatus) => {ok: true}`                | `{"athleteId":"cm1abc...","status":"PAUSED"}`                             | Badge (cambio de estado)          | `/admin/atletas/page.tsx`               |
| `createAthlete`         | `(data: unknown) => Promise<Athlete>`                                     | `{"firstName":"Luis","lastName":"Perez","phone":"+52..."}`                | None (mutación)                   | Modal/form en `/admin/atletas`          |

---

## `src/server/actions/attendance.ts`

| Función                     | Firma                                                                     | Payload ejemplo                                   | Visual                                              | UI                                                |
| --------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------- |
| `getTodayClasses`           | `() => Promise<DayClass[]>`                                               | `{}`                                              | Table / Card list                                   | `/admin/asistencia/page.tsx`                      |
| `getTodayStats`             | `() => Promise<DayStats>`                                                 | `{}`                                              | Card (KPIs: clases, booked, attended, noShow, rate) | `/admin/asistencia/page.tsx`                      |
| `recomputeAttendanceStreak` | `(athleteId: string) => Promise<{count: number}>`                         | `{"athleteId":"cm1abc..."}`                       | Badge (streak)                                      | Trigger interno / `/atleta`                       |
| `getAttendanceByDay`        | `(opts: {dateFrom, dateTo, coachId?}) => Promise<AttendanceByDayPoint[]>` | `{"dateFrom":"2024-01-01","dateTo":"2024-01-31"}` | BarChart                                            | `/admin/asistencia/page.tsx` (AttendanceBarChart) |
| `getAttendanceHeatmap`      | `(opts: {dateFrom, dateTo}) => Promise<AttendanceHeatmapCell[]>`          | `{"dateFrom":"2024-01-01","dateTo":"2024-01-31"}` | Heatmap                                             | `/admin/asistencia/page.tsx` (DayHourHeatmap)     |
| `listFrequentNoShows`       | `(opts?: {windowDays?, threshold?}) => Promise<FrequentNoShow[]>`         | `{"windowDays":30,"threshold":3}`                 | Table                                               | `/admin/asistencia/page.tsx`                      |
| `getAthleteStreak`          | `(athleteId: string) => Promise<number>`                                  | `{"athleteId":"cm1abc..."}`                       | Badge                                               | `/atleta/page.tsx`                                |

---

## `src/server/actions/prs.ts`

| Función              | Firma                                                                                 | Payload ejemplo                                                 | Visual    | UI                                  |
| -------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------- | --------- | ----------------------------------- |
| `listAllPRs`         | `(opts?: {athleteId?, movementId?}) => Promise<PRRow[]>`                              | `{"athleteId":"cm1abc...","movementId":"cm2xyz..."}`            | Table     | `/admin/prs/page.tsx`               |
| `listAllPRsPaged`    | `(opts?: ListOpts<PRSort> & {athleteId?, movementId?}) => Promise<ListResult<PRRow>>` | `{"page":1,"search":"Clean","sortBy":"value"}`                  | Table     | `/admin/prs/page.tsx`               |
| `listMyPRs`          | `() => Promise<PRRow[]>`                                                              | `{}`                                                            | Table     | `/atleta/prs/page.tsx`              |
| `getPRProgression`   | `(athleteId: string, movementId: string, days=180) => Promise<PRProgressionResult>`   | `{"athleteId":"cm1abc...","movementId":"cm2xyz...","days":180}` | LineChart | `/atleta/prs/[movementId]/page.tsx` |
| `getMyPRProgression` | `(movementId: string, days=180) => Promise<PRProgressionResult>`                      | `{"movementId":"cm2xyz...","days":180}`                         | LineChart | `/atleta/prs/[movementId]/page.tsx` |

---

## `src/server/actions/leaderboards.ts`

| Función                          | Firma                                                  | Payload ejemplo              | Visual               | UI                             |
| -------------------------------- | ------------------------------------------------------ | ---------------------------- | -------------------- | ------------------------------ |
| `getWODLeaderboard`              | `(wodId: string) => Promise<WODLeaderboard>`           | `{"wodId":"cm3wod..."}`      | Table (ranking)      | `/admin/leaderboards/page.tsx` |
| `getMovementLeaderboard`         | `(movementId: string) => Promise<MovementLeaderboard>` | `{"movementId":"cm2xyz..."}` | Table (ranking)      | `/admin/leaderboards/page.tsx` |
| `getWeeklyAttendanceLeaderboard` | `(weeksBack=0) => Promise<AttendanceLeader[]>`         | `{"weeksBack":0}`            | BarChart / Table     | `/admin/leaderboards/page.tsx` |
| `listWODOptions`                 | `() => Promise<{id, name, scoreType}[]>`               | `{}`                         | None (dropdown data) | Filtros en leaderboards        |
| `listMovementOptions`            | `() => Promise<{id, name}[]>`                          | `{}`                         | None (dropdown data) | Filtros en leaderboards        |

---

## `src/server/actions/scores.ts`

| Función              | Firma                                                   | Payload ejemplo                                               | Visual             | UI                             |
| -------------------- | ------------------------------------------------------- | ------------------------------------------------------------- | ------------------ | ------------------------------ |
| `listMyScores`       | `(limit=50) => Promise<MyScoreRow[]>`                   | `{"limit":10}`                                                | Table / Timeline   | `/atleta/wod/page.tsx`         |
| `getTodayWOD`        | `() => Promise<TodayWOD>`                               | `{}`                                                          | Card (WOD del día) | `/atleta/wod/page.tsx`         |
| `getMyWODPercentile` | `(wodId: string) => Promise<MyWODPercentile \| null>`   | `{"wodId":"cm3wod..."}`                                       | Card (percentil)   | `/atleta/wod/[wodId]/page.tsx` |
| `listScoresForWOD`   | `(wodId: string) => Promise<Score[]>`                   | `{"wodId":"cm3wod..."}`                                       | Table              | `/admin/wods/[id]/scores`      |
| `submitScore`        | `(data: unknown) => Promise<{ok, scoreId, prAchieved}>` | `{"wodId":"cm3wod...","value":95,"unit":"kg","scaling":"RX"}` | None (mutación)    | Form en `/atleta/wod`          |

---

## `src/server/actions/reports.ts`

| Función              | Firma                                            | Payload ejemplo | Visual                       | UI                                            |
| -------------------- | ------------------------------------------------ | --------------- | ---------------------------- | --------------------------------------------- |
| `getReports`         | `() => Promise<Reports>`                         | `{}`            | Card (KPIs) + BarChart/Table | `/admin/reportes/page.tsx`                    |
| `getRevenueByMonth`  | `(months=12) => Promise<RevenueByMonthPoint[]>`  | `{"months":6}`  | LineChart                    | `/admin/reportes/page.tsx` (RevenueLineChart) |
| `getAthletesByMonth` | `(months=12) => Promise<AthletesByMonthPoint[]>` | `{"months":6}`  | BarChart                     | `/admin/reportes/page.tsx` (NewChurnBarChart) |

**Reports keys:** monthRevenue, prevMonthRevenue, revenueDelta, mrr, monthClassesHeld, monthBookings, monthAttended, monthNoShow, attendanceRate, activeAthletes, pausedAthletes, newAthletesMonth, churnedMembershipsMonth, monthScores, monthPRs, topWODs, topAttendees, planDistribution.

---

## `src/server/actions/bookings.ts`

| Función                | Firma                                           | Payload ejemplo             | Visual                   | UI                           |
| ---------------------- | ----------------------------------------------- | --------------------------- | ------------------------ | ---------------------------- |
| `listAvailableClasses` | `(daysAhead=7) => Promise<AvailableClass[]>`    | `{"daysAhead":7}`           | Card list / Table        | `/atleta/reservar/page.tsx`  |
| `getClassRoster`       | `(classId: string) => Promise<ClassRoster>`     | `{"classId":"cm4cls..."}`   | Table (lista de atletas) | `/admin/reservas/page.tsx`   |
| `bookClass`            | `(classId: string) => Promise<BookingDecision>` | `{"classId":"cm4cls..."}`   | None (mutación)          | Botón en `/atleta/reservar`  |
| `cancelBooking`        | `(bookingId: string) => Promise<{ok: true}>`    | `{"bookingId":"cm5bkg..."}` | None (mutación)          | Botón en `/atleta/reservar`  |
| `checkInAthlete`       | `(bookingId: string) => Promise<{ok: true}>`    | `{"bookingId":"cm5bkg..."}` | None (mutación)          | `/admin/asistencia/page.tsx` |
| `markNoShow`           | `(bookingId: string) => Promise<{ok: true}>`    | `{"bookingId":"cm5bkg..."}` | None (mutación)          | `/admin/asistencia/page.tsx` |

---

## `src/server/actions/classes.ts`

| Función              | Firma                                                | Payload ejemplo                                                      | Visual           | UI                             |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------------------------- | ---------------- | ------------------------------ |
| `listClassesInRange` | `(from: Date, to: Date) => Promise<ClassRow[]>`      | `{"from":"2024-01-01","to":"2024-01-31"}`                            | Table / Calendar | `/admin/programacion/page.tsx` |
| `listCoaches`        | `() => Promise<{id, name, email}[]>`                 | `{}`                                                                 | None (dropdown)  | Form de crear clase            |
| `listWODs`           | `() => Promise<{id, name, type}[]>`                  | `{}`                                                                 | None (dropdown)  | Form de crear clase            |
| `createClass`        | `(data: unknown) => Promise<{created: number}>`      | `{"startsAt":"2024-01-15T09:00:00Z","durationMin":60,"capacity":15}` | None (mutación)  | Modal en `/admin/programacion` |
| `cancelClass`        | `(id: string) => Promise<{ok: true}>`                | `{"id":"cm4cls..."}`                                                 | None (mutación)  | `/admin/programacion/page.tsx` |
| `updateClass`        | `(id: string, data: unknown) => Promise<{ok: true}>` | `{"id":"cm4cls...","data":{"capacity":20}}`                          | None (mutación)  | `/admin/programacion/page.tsx` |

---

## `src/server/actions/wods.ts`

| Función      | Firma                                                | Payload ejemplo                                                          | Visual          | UI                          |
| ------------ | ---------------------------------------------------- | ------------------------------------------------------------------------ | --------------- | --------------------------- |
| `listWODs`   | `(opts?: {type?, search?}) => Promise<WODSummary[]>` | `{"type":"AMRAP","search":"Fran"}`                                       | Table           | `/admin/wods/page.tsx`      |
| `getWOD`     | `(id: string) => Promise<WOD \| null>`               | `{"id":"cm3wod..."}`                                                     | Card (detalle)  | `/admin/wods/[id]/page.tsx` |
| `createWOD`  | `(data: unknown) => Promise<WOD>`                    | `{"name":"Fran","type":"FOR_TIME","scoreType":"TIME","movements":[...]}` | None (mutación) | Modal en `/admin/wods`      |
| `archiveWOD` | `(id: string) => Promise<{ok: true}>`                | `{"id":"cm3wod..."}`                                                     | None (mutación) | `/admin/wods/page.tsx`      |

---

## `src/server/actions/movements.ts`

| Función          | Firma                                                       | Payload ejemplo                                | Visual          | UI                                |
| ---------------- | ----------------------------------------------------------- | ---------------------------------------------- | --------------- | --------------------------------- |
| `listMovements`  | `(search?: string) => Promise<{id, name, videoUrl, ...}[]>` | `{"search":"Clean"}`                           | Table / List    | `/admin/wods/page.tsx` (dropdown) |
| `createMovement` | `(data: unknown) => Promise<Movement>`                      | `{"name":"Power Clean","equipment":"barbell"}` | None (mutación) | Modal en `/admin/wods`            |

---

## `src/server/actions/box.ts`

| Función     | Firma                                     | Payload ejemplo                            | Visual          | UI                        |
| ----------- | ----------------------------------------- | ------------------------------------------ | --------------- | ------------------------- |
| `getBox`    | `() => Promise<BoxSettings>`              | `{}`                                       | Card (settings) | `/admin/ajustes/page.tsx` |
| `updateBox` | `(data: unknown) => Promise<BoxSettings>` | `{"name":"CrossFit XYZ","currency":"MXN"}` | None (mutación) | `/admin/ajustes/page.tsx` |

---

## `src/server/actions/payments.ts`

| Función                  | Firma                                                                               | Payload ejemplo                                               | Visual                | UI                                     |
| ------------------------ | ----------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------------------- | -------------------------------------- |
| `listPayments`           | `(opts?: {status?, gateway?, fromDate?, toDate?, limit?}) => Promise<PaymentRow[]>` | `{"status":"PAID","limit":50}`                                | Table                 | `/admin/pagos/page.tsx`                |
| `listPaymentsPaged`      | `(opts?: ListOpts<PaymentSort> & {gateway?}) => Promise<ListResult<PaymentRow>>`    | `{"page":1,"search":"Luis","sortBy":"amount"}`                | Table                 | `/admin/pagos/page.tsx`                |
| `getRevenueByDay`        | `(opts: {dateFrom, dateTo}) => Promise<RevenueByDayPoint[]>`                        | `{"dateFrom":"2024-01-01","dateTo":"2024-01-31"}`             | BarChart              | `/admin/pagos/page.tsx` (RevenueChart) |
| `listOverdueMemberships` | `(opts?: {graceDays?, limit?}) => Promise<OverdueMembership[]>`                     | `{"graceDays":3,"limit":50}`                                  | Table                 | `/admin/pagos/page.tsx`                |
| `getPaymentStats`        | `() => Promise<PaymentStats>`                                                       | `{}`                                                          | Card (KPIs)           | `/admin/pagos/page.tsx`                |
| `registerCashPayment`    | `(data: unknown) => Promise<{ok: true}>`                                            | `{"membershipId":"cm6mem...","amount":1500,"currency":"MXN"}` | None (mutación)       | `/admin/pagos/page.tsx`                |
| `initMpCheckout`         | `(input: unknown) => Promise<InitCheckoutResult>`                                   | `{"membershipId":"cm6mem..."}`                                | None (redirección MP) | `/atleta/pagos/page.tsx`               |
| `getPaymentStatus`       | `(paymentId: string) => Promise<PaymentStatus \| null>`                             | `{"paymentId":"cm7pay..."}`                                   | Card (estado)         | `/atleta/pagos/[id]/resultado`         |
| `listAthleteMemberships` | `() => Promise<MembershipWithPayments[]>`                                           | `{}`                                                          | Table / Card list     | `/atleta/pagos/page.tsx`               |
| `voidPayment`            | `(id: string) => Promise<{ok: true}>`                                               | `{"id":"cm7pay..."}`                                          | None (mutación)       | `/admin/pagos/page.tsx`                |

---

## `src/server/actions/memberships.ts`

| Función                | Firma                                                                                 | Payload ejemplo                                                           | Visual          | UI                      |
| ---------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------- | ----------------------- |
| `listMemberships`      | `(opts?: {status?, athleteId?}) => Promise<MembershipRow[]>`                          | `{"status":"ACTIVE","athleteId":"cm1abc..."}`                             | Table           | `/admin/pagos/page.tsx` |
| `listMembershipsPaged` | `(opts?: ListOpts<MembershipSort> & {planId?}) => Promise<ListResult<MembershipRow>>` | `{"page":1,"search":"Luis"}`                                              | Table           | `/admin/pagos/page.tsx` |
| `assignMembership`     | `(data: unknown) => Promise<Membership>`                                              | `{"athleteId":"cm1abc...","planId":"cm8pln...","startDate":"2024-01-01"}` | None (mutación) | `/admin/pagos/page.tsx` |
| `pauseMembership`      | `(id: string) => Promise<{ok: true}>`                                                 | `{"id":"cm6mem..."}`                                                      | Badge + None    | `/admin/pagos/page.tsx` |
| `resumeMembership`     | `(id: string) => Promise<{ok: true}>`                                                 | `{"id":"cm6mem..."}`                                                      | Badge + None    | `/admin/pagos/page.tsx` |
| `cancelMembership`     | `(id: string) => Promise<{ok: true}>`                                                 | `{"id":"cm6mem..."}`                                                      | None (mutación) | `/admin/pagos/page.tsx` |

---

## `src/server/actions/plans.ts`

| Función          | Firma                                               | Payload ejemplo                                        | Visual          | UI                                   |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------ | --------------- | ------------------------------------ |
| `listPlans`      | `(opts?: {includeArchived?}) => Promise<PlanRow[]>` | `{"includeArchived":true}`                             | Table           | `/admin/pagos/page.tsx` (tab Planes) |
| `createPlan`     | `(data: unknown) => Promise<{ok: true}>`            | `{"name":"Unlimited","type":"UNLIMITED","price":1500}` | None (mutación) | Modal en `/admin/pagos`              |
| `archivePlan`    | `(id: string) => Promise<{ok: true}>`               | `{"id":"cm8pln..."}`                                   | None (mutación) | `/admin/pagos/page.tsx`              |
| `reactivatePlan` | `(id: string) => Promise<{ok: true}>`               | `{"id":"cm8pln..."}`                                   | None (mutación) | `/admin/pagos/page.tsx`              |

---

## `src/server/actions/announcements.ts`

| Función              | Firma                                           | Payload ejemplo                                                  | Visual          | UI                               |
| -------------------- | ----------------------------------------------- | ---------------------------------------------------------------- | --------------- | -------------------------------- |
| `listAnnouncements`  | `() => Promise<AnnouncementRow[]>`              | `{}`                                                             | Table           | `/admin/comunicaciones/page.tsx` |
| `createAnnouncement` | `(data: unknown) => Promise<{ok, id}>`          | `{"title":"Horario","body":"Nuevo horario...","audience":"ALL"}` | None (mutación) | Modal en `/admin/comunicaciones` |
| `sendAnnouncement`   | `(id: string) => Promise<{ok, recipientCount}>` | `{"id":"cm9ann..."}`                                             | None (mutación) | Botón en `/admin/comunicaciones` |
| `deleteAnnouncement` | `(id: string) => Promise<{ok: true}>`           | `{"id":"cm9ann..."}`                                             | None (mutación) | `/admin/comunicaciones/page.tsx` |

---

## `src/server/actions/athlete-home.ts`

| Función                  | Firma                                          | Payload ejemplo | Visual                                                               | UI                                      |
| ------------------------ | ---------------------------------------------- | --------------- | -------------------------------------------------------------------- | --------------------------------------- |
| `getMyAttendanceLast90d` | `() => Promise<MyAttendanceDay[]>`             | `{}`            | Heatmap                                                              | `/atleta/page.tsx` (Heatmap asistencia) |
| `getMyScoresTimeline`    | `(days=90) => Promise<MyScoreTimelinePoint[]>` | `{"days":30}`   | LineChart / BarChart                                                 | `/atleta/page.tsx`                      |
| `getAthleteHome`         | `() => Promise<AthleteHome>`                   | `{}`            | Card (KPIs: streak, weekAttendance, nextBooking, lastScore, prCount) | `/atleta/page.tsx`                      |

---

## `src/server/actions/tv.ts`

| Función        | Firma                                  | Payload ejemplo           | Visual                                       | UI                    |
| -------------- | -------------------------------------- | ------------------------- | -------------------------------------------- | --------------------- |
| `getTVDisplay` | `(slug: string) => Promise<TVDisplay>` | `{"slug":"crossfit-xyz"}` | Card (clases actuales) + Table (leaders/PRs) | `/tv/[slug]/page.tsx` |

---

## `src/server/actions/audit-log.ts`

| Función           | Firma                                                                            | Payload ejemplo                       | Visual | UI                                  |
| ----------------- | -------------------------------------------------------------------------------- | ------------------------------------- | ------ | ----------------------------------- |
| `listAuditEvents` | `(opts?: {targetType?, targetId?, action?, limit?}) => Promise<AuditEventRow[]>` | `{"targetType":"Payment","limit":50}` | Table  | `/admin/audit/page.tsx` (si existe) |

---

## `src/server/analytics/adherence.ts`

| Función                  | Firma                                                             | Payload ejemplo                              | Visual                   | UI                                 |
| ------------------------ | ----------------------------------------------------------------- | -------------------------------------------- | ------------------------ | ---------------------------------- |
| `getMyAdherence`         | `(period="month") => Promise<AdherenceReport \| null>`            | `{"period":"quarter"}`                       | Card (ratios) + BarChart | `/atleta/page.tsx` (AdherenceCard) |
| `getAthleteAdherence`    | `(athleteId: string, period="month") => Promise<AdherenceReport>` | `{"athleteId":"cm1abc...","period":"month"}` | Card (ratios) + BarChart | `/admin/atletas/[id]/page.tsx`     |
| `getMyAttendanceHeatmap` | `(days=90) => Promise<AthleteHeatmapResult>`                      | `{"days":90}`                                | Heatmap                  | `/atleta/page.tsx`                 |

---

## `src/server/analytics/movement.ts`

| Función                      | Firma                                                                                | Payload ejemplo                                      | Visual                                | UI                                  |
| ---------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------- | ----------------------------------- |
| `getAthleteMovementProfile`  | `(athleteId: string, movementId: string) => Promise<AthleteMovementProfile \| null>` | `{"athleteId":"cm1abc...","movementId":"cm2xyz..."}` | Card (perfil) + LineChart (sparkline) | `/admin/atletas/[id]/movimientos`   |
| `listAthleteMovementsRanked` | `(athleteId: string, limit=10) => Promise<RankedMovement[]>`                         | `{"athleteId":"cm1abc...","limit":10}`               | Table                                 | `/admin/atletas/[id]/movimientos`   |
| `getMyMovementProfile`       | `(movementId: string) => Promise<AthleteMovementProfile \| null>`                    | `{"movementId":"cm2xyz..."}`                         | Card + LineChart                      | `/atleta/movimientos/[id]/page.tsx` |
| `listMyMovementsRanked`      | `(limit=10) => Promise<RankedMovement[]>`                                            | `{"limit":10}`                                       | Table                                 | `/atleta/movimientos/page.tsx`      |

---

## `src/server/analytics/tonnage.ts`

| Función                     | Firma                                                                                 | Payload ejemplo                                            | Visual                                              | UI                                           |
| --------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------- |
| `getAthleteTonnageTimeline` | `(athleteId: string, period="week", rangeDays=90) => Promise<TonnageTimelinePoint[]>` | `{"athleteId":"cm1abc...","period":"week","rangeDays":90}` | BarChart / AreaChart                                | `/admin/atletas/[id]/page.tsx`               |
| `getMyTonnageTimeline`      | `(period="week", rangeDays=90) => Promise<TonnageTimelinePoint[]>`                    | `{"period":"week","rangeDays":90}`                         | BarChart / AreaChart                                | `/atleta/page.tsx`                           |
| `getBoxTonnageSummary`      | `(rangeDays=30) => Promise<BoxTonnageSummary>`                                        | `{"rangeDays":30}`                                         | Card (totalKg, sessions) + BarChart (top movements) | `/admin/reportes/page.tsx` o dashboard admin |

---

## Resumen por Visualización

| Visual        | Funciones que la alimentan                                                                                                                                                                                                                                                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LineChart** | `getAthleteGrowthByDay`, `getPRProgression`, `getMyPRProgression`, `getRevenueByMonth`, `getMyScoresTimeline`                                                                                                                                                                                                                                       |
| **BarChart**  | `getAttendanceByDay`, `getWeeklyAttendanceLeaderboard`, `getAthletesByMonth`, `getRevenueByDay`, `getMyTonnageTimeline`, `getAthleteTonnageTimeline`, `getBoxTonnageSummary`                                                                                                                                                                        |
| **Heatmap**   | `getAttendanceHeatmap`, `getMyAttendanceHeatmap`, `getMyAttendanceLast90d`                                                                                                                                                                                                                                                                          |
| **Card**      | `getDashboardData`, `getTodayStats`, `getReports`, `getPaymentStats`, `getAthleteHome`, `getTVDisplay`, `getMyAdherence`, `getAthleteAdherence`, `getMyWODPercentile`, `getBoxTonnageSummary`                                                                                                                                                       |
| **Table**     | `listAthletesPaged`, `listAllPRsPaged`, `listPaymentsPaged`, `listMembershipsPaged`, `getWODLeaderboard`, `getMovementLeaderboard`, `listFrequentNoShows`, `listOverdueMemberships`, `getClassRoster`, `listClassesInRange`, `listWODs`, `listPlans`, `listAnnouncements`, `listAuditEvents`, `listAthleteMovementsRanked`, `listMyMovementsRanked` |
| **Badge**     | `updateAthleteStatus`, `getAthleteStreak`, `recomputeAttendanceStreak`                                                                                                                                                                                                                                                                              |
| **None**      | Mutaciones (create*, update*, cancel*, archive*, submitScore, bookClass, registerCashPayment, initMpCheckout, etc.) y helpers (`normalizePagination`, `dateRangeFilter`, `listCoaches`, `listWODOptions`, `listMovementOptions`)                                                                                                                    |
