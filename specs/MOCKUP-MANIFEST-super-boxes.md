# MOCKUP MANIFEST — /admin/super/boxes

Fecha: 2025-05-25
Estado: MOCKUP funcional completo. Pendiente /build para conectar a datos reales.

---

## Componentes creados

| Archivo                                                     | Tipo              | Descripción                                         |
| ----------------------------------------------------------- | ----------------- | --------------------------------------------------- |
| `src/app/admin/super/boxes/page.tsx`                        | Server Component  | Página principal. Lee `?__mock` y despacha fixture. |
| `src/app/admin/super/boxes/_components/types.ts`            | Tipos             | `SuperBoxRow`, `MockState`                          |
| `src/app/admin/super/boxes/_components/StatusBadge.tsx`     | UI                | Badge de estado con colores V3                      |
| `src/app/admin/super/boxes/_components/BoxesFilters.tsx`    | Client            | FilterBar con SearchInput + SelectFilter            |
| `src/app/admin/super/boxes/_components/BoxesTable.tsx`      | Client            | DataTable + Pagination + apertura de drawer         |
| `src/app/admin/super/boxes/_components/BoxDrawer.tsx`       | Client            | Panel lateral de detalle del box                    |
| `src/app/admin/super/boxes/_components/MockStateToggle.tsx` | Client (dev-only) | Toggle flotante + atajos Ctrl+1/2/3                 |

## Fixtures

| Archivo                               | Estado   | Descripción                                              |
| ------------------------------------- | -------- | -------------------------------------------------------- |
| `src/mocks/super-boxes/positive.json` | POSITIVO | 14 boxes reales MX, mezcla de estados, paginación activa |
| `src/mocks/super-boxes/negative.json` | NEGATIVO | Error INTERNAL_ERROR con mensaje                         |
| `src/mocks/super-boxes/neutral.json`  | NEUTRO   | 3 boxes TRIAL sin owner ni plan (edge case onboarding)   |

## Shape del dato (SuperBoxRow)

```typescript
type SuperBoxRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string;
  subscriptionStatus: "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  ownerEmail: string | null;
  athleteCount: number;
  userCount: number;
  planName: string | null; // NUEVO — no existe en PlatformBoxRow actual
  createdAt: string; // ISO string en mockup; Date en producción
};
```

## Diferencias mockup vs producción

| Campo       | Mockup                  | Producción                                             |
| ----------- | ----------------------- | ------------------------------------------------------ |
| `createdAt` | `string` (ISO)          | `Date` (serializar antes de pasar al client component) |
| `planName`  | fixture hardcoded       | Join en query Prisma (ver contrato abajo)              |
| Filtros     | client-side en page.tsx | Server-side en `listAllBoxesCrossTenant()`             |
| Paginación  | slice de array          | `skip/take` en Prisma                                  |

## Contratos API para /build

### Server action a crear: `listAllBoxesCrossTenant()`

```typescript
// src/server/actions/super-boxes.ts
"use server";

import { db as prismaBase } from "@/server/db";
import { requireSuperAdmin } from "@/server/super-admin-guard";

export type SuperBoxRow = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string;
  subscriptionStatus: string;
  ownerEmail: string | null;
  athleteCount: number;
  userCount: number;
  planName: string | null; // @build: join con tabla Plan o campo planName en Box
  createdAt: Date;
};

export type ListBoxesResult = {
  rows: SuperBoxRow[];
  total: number;
};

export async function listAllBoxesCrossTenant(params: {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
}): Promise<ListBoxesResult> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { rows: [], total: 0 };

  // @build: implementar con prismaBase.box.findMany() + _count + owner lookup
  // Similar a getPlatformStats() pero con paginación, filtros y planName join
}
```

### KPIs separados a crear: `getSuperBoxKpis()`

```typescript
// @build: totalBoxes, active, trial, expired/cancelled/past_due
// Para no recargar toda la lista cuando el usuario solo cambia filtros
```

## Pendiente para /build

- [ ] Implementar `listAllBoxesCrossTenant()` con prismaBase + requireSuperAdmin + paginación real
- [ ] Agregar `planName` al schema de Prisma (field en Box o join con tabla Plan)
- [ ] Implementar `getSuperBoxKpis()` para KPIs independientes de los filtros
- [ ] Serializar `createdAt` como ISO string en el server action antes de passar al client
- [ ] Acciones en BoxDrawer: cambio de plan, cancelación, notas internas
- [ ] Reemplazar filtros client-side en `page.tsx` por server-side en el action
- [ ] Quitar imports de fixtures y `__mock` query param en producción
- [ ] Agregar exportación CSV (ExportCSVButton) similar a AtletasTable
- [ ] E2E test: visita `/admin/super/boxes`, verifica tabla visible + drill-down funciona

## Cómo navegar el mockup

```
URL base:          http://localhost:3007/admin/super/boxes
Estado positivo:   http://localhost:3007/admin/super/boxes?__mock=positive   (default)
Estado negativo:   http://localhost:3007/admin/super/boxes?__mock=negative
Estado neutro:     http://localhost:3007/admin/super/boxes?__mock=neutral

Filtros:           ?q=dominus&status=ACTIVE
Paginación:        ?page=2

Atajos de teclado (dev-only):
  Ctrl+1 → positivo
  Ctrl+2 → negativo
  Ctrl+3 → neutro
```

## Discoveries / gotchas

1. **JSON con comentarios**: TypeScript con `resolveJsonModule: true` no acepta `//` en .json. Los fixtures usan campos `__mock_*` como documentación embebida en lugar de comentarios.
2. **Fechas en client components**: `BoxDrawer` y `BoxesTable` reciben `createdAt` como `string` ISO y hacen `new Date(iso)` solo dentro del `toLocaleDateString()` call — no en el render path que afecta hidratación, porque estos son client components que se montan post-hydration.
3. **`DataTable` selectable**: la fila seleccionada usa `bg-[var(--blue-soft)]` (legacy token) internamente — NO cambiar sin coordinación con Kimi.
4. **`SearchInput`**: usa `paramKey="q"` por default — compatible con el filtro que implementamos.
5. **`requireSuperAdmin()`**: en el server action de producción, usa el mismo patrón que `getPlatformStats()` — retorna early con empty si no es super-admin (no revela existencia de datos).
