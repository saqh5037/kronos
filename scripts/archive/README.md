# `scripts/archive/` — one-off scripts, retired

Destino de todo script que ya corrió su propósito y no se vuelve a invocar.
Se archiva en vez de borrarse porque el script **es** el registro de qué se le
hizo a los datos o al código, y ese registro se necesita cuando alguien
pregunta seis meses después por qué una tabla se ve así.

## Regla

| Tipo de script                                                   | Dónde vive         |
| ---------------------------------------------------------------- | ------------------ |
| Operación permanente (`deploy.sh`, `smoke.sh`)                   | `scripts/`         |
| Seeds y backfills que se vuelven a correr en ambientes nuevos    | `scripts/`         |
| One-off que ya corrió (sweep de tokens, limpieza de un registro) | `scripts/archive/` |

`.gitignore` ignora `scripts/*` por default y opta-in explícito a los
permanentes. `scripts/archive/` y `scripts/guards/` están opt-in como
directorios, así que lo que se mueva aquí **sí** se trackea: al archivar,
agrega la línea al inventario de abajo en el mismo commit.

## Inventario

Vacío por ahora. Los one-offs que la auditoría del 2026-09-15 encontró en
`scripts/` (`reduce-lime.js`, `final-lime-sweep.js`, `refactor_lime.py`,
`remove-bernardo-quiroz.ts`, `check-miyagi.ts` y el pipeline de video/voz de
tutoriales) **nunca estuvieron trackeados** — vivían local bajo la regla
`scripts/*` del `.gitignore` y ya no están en disco, así que no hay nada que
mover ni historia que preservar. Se documentan aquí solo para cerrar el hallazgo
del inventario de código y para que la próxima tanda no repita el patrón.

Formato de cada entrada nueva — una línea, qué hizo y cuándo:

```
- `nombre-del-script.ts` — qué hizo, en una línea. Corrió 2026-09-15.
```

## Antes de archivar

1. ¿Es realmente one-off? Un backfill que corre en cada ambiente nuevo va en
   `scripts/`, no aquí.
2. ¿Trae credenciales, correos reales o nombres de clientes hardcodeados?
   Sanéalos antes: `scripts/archive/` se commitea.
3. Agrega la línea al inventario en el mismo commit que mueve el archivo.
