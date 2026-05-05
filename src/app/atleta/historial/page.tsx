import { listWODOptions } from "@/server/actions/leaderboards";
import HistorialView from "./HistorialView";

export const metadata = { title: "Kronos — Historial" };

export default async function HistorialPage() {
  const wodOptions = await listWODOptions();
  return <HistorialView wodOptions={wodOptions} />;
}
