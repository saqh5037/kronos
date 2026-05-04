export const metadata = { title: "Kronos — Dashboard" };

export default function AdminDashboardPage() {
  return (
    <div className="p-8">
      <p className="k-eyebrow mb-2">Dashboard</p>
      <h1 className="font-display font-bold text-3xl tracking-tight">
        Panel de control
      </h1>
      <p className="mt-4 text-sm" style={{ color: "var(--text-2)" }}>
        Módulos disponibles en la barra lateral.
      </p>
    </div>
  );
}
