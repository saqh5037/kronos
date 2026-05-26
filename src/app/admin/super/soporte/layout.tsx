import { getActiveSupportSession } from "@/server/actions/support";
import { SupportBanner } from "./_components/SupportBanner";

/**
 * Nested layout for /admin/super/soporte — mounts the sticky amber banner
 * when there is an active support session.
 */
export default async function SoporteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getActiveSupportSession();

  return (
    <div className="min-h-screen">
      {session && (
        <SupportBanner
          boxName={session.boxName}
          expiresAt={session.expiresAt}
        />
      )}
      {children}
    </div>
  );
}
