import { notFound } from "next/navigation";
import { ChartsDemo } from "./ChartsDemo";

export const dynamic = "force-dynamic";

export default function ChartsDemoPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return <ChartsDemo />;
}
