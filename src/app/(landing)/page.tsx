import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import LandingTracker from "./_components/LandingTracker";
import RouterSplit from "./_components/router/RouterSplit";

export default async function HomeRouter() {
  const session = await getServerSession(authOptions);

  // Sesión activa → ir directo al surface correcto
  if (session?.user) {
    const target = session.user.role === "ATHLETE" ? "/atleta" : "/admin";
    redirect(target);
  }

  return (
    <>
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <LandingTracker />
      <RouterSplit />
    </>
  );
}
