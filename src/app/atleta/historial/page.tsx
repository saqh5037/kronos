import { listWODOptions } from "@/server/actions/leaderboards";
import HistorialView from "./HistorialView";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";

export const metadata = { title: "Kronos — Historial" };

export default async function HistorialPage() {
  const wodOptions = await listWODOptions();
  return (
    <>
      <div style={{ padding: "48px 16px 0" }}>
        <AthleteBackLink href="/atleta" label="Inicio" />
      </div>
      <HistorialView wodOptions={wodOptions} />
    </>
  );
}
