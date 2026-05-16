/**
 * Hyrox race stations canónicas.
 *
 * Hyrox Standard Race = 8 km running + 8 functional stations alternados:
 * cada 1km de run termina en 1 station. Total ~60-90 min según división.
 *
 * Referencia: https://hyrox.com/race-format/
 */

export type HyroxStationId =
  | "run"
  | "ski"
  | "sled-push"
  | "sled-pull"
  | "burpee-broad"
  | "row"
  | "farmer"
  | "sandbag-lunges"
  | "wall-balls";

export type HyroxStation = {
  id: HyroxStationId;
  label: string;
  defaultDescription: string;
  /** Distancia o reps por default (Open Division Male). */
  defaultMetric: string;
};

export const HYROX_STATIONS: ReadonlyArray<HyroxStation> = [
  {
    id: "run",
    label: "Running",
    defaultDescription: "Carrera entre estaciones",
    defaultMetric: "1km",
  },
  {
    id: "ski",
    label: "Ski Erg",
    defaultDescription: "Estación 1 después del primer km",
    defaultMetric: "1km",
  },
  {
    id: "sled-push",
    label: "Sled Push",
    defaultDescription: "Empujar sled cargado",
    defaultMetric: "50m · 152kg (M) / 102kg (F)",
  },
  {
    id: "sled-pull",
    label: "Sled Pull",
    defaultDescription: "Halar sled con cuerda",
    defaultMetric: "50m · 103kg (M) / 78kg (F)",
  },
  {
    id: "burpee-broad",
    label: "Burpee Broad Jumps",
    defaultDescription: "Burpee + salto al frente",
    defaultMetric: "80m",
  },
  {
    id: "row",
    label: "Rowing",
    defaultDescription: "Remo en máquina",
    defaultMetric: "1km",
  },
  {
    id: "farmer",
    label: "Farmers Carry",
    defaultDescription: "Caminar con kettlebells",
    defaultMetric: "200m · 24kg×2 (M) / 16kg×2 (F)",
  },
  {
    id: "sandbag-lunges",
    label: "Sandbag Lunges",
    defaultDescription: "Desplantes con saco al hombro",
    defaultMetric: "100m · 20kg (M) / 10kg (F)",
  },
  {
    id: "wall-balls",
    label: "Wall Balls",
    defaultDescription: "Lanzamientos a target",
    defaultMetric: "100 reps · 6kg (M) / 4kg (F)",
  },
];

export const HYROX_STATION_BY_ID: Readonly<
  Record<HyroxStationId, HyroxStation>
> = Object.fromEntries(
  HYROX_STATIONS.map((station) => [station.id, station]),
) as Record<HyroxStationId, HyroxStation>;

export function getHyroxStation(id: string): HyroxStation | undefined {
  return HYROX_STATION_BY_ID[id as HyroxStationId];
}
