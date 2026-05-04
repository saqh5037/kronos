import PaymentResultClient from "./client";

export const metadata = { title: "Kronos — Resultado del pago" };
export const dynamic = "force-dynamic";

export default async function PaymentResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { id } = await params;
  const { status } = await searchParams;
  return <PaymentResultClient paymentId={id} initialStatus={status ?? null} />;
}
