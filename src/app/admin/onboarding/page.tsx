import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { getBox, getBoxSchedule } from "@/server/actions/box";
import { getOnboardingStatus } from "@/server/actions/onboarding";
import OnboardingWizard from "./OnboardingWizard";

export const metadata = { title: "Kronos — Configurá tu box" };

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin");

  const [box, schedule, status] = await Promise.all([
    getBox(),
    getBoxSchedule(),
    getOnboardingStatus(),
  ]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <OnboardingWizard box={box} schedule={schedule} status={status} />
      </div>
    </div>
  );
}
