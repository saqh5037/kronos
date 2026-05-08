import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db";
import { sendEmail } from "@/lib/email";

const leadSchema = z.object({
  ownerName: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().min(8),
  boxName: z.string().min(1),
  athletes: z.enum([
    "less_than_50",
    "50_100",
    "100_200",
    "200_500",
    "more_than_500",
  ]),
  currentSw: z
    .enum([
      "wodify",
      "pushpress",
      "sugarwod",
      "boxmagic",
      "excel",
      "other",
      "none",
    ])
    .optional(),
  planInterest: z.enum(["hierro", "acero", "titanio", "unsure"]).optional(),
  notes: z.string().max(500).optional(),
  consent: z.literal(true),
  website: z.string().optional(), // honeypot
});

const RATE_LIMIT = new Map<string, number[]>();
const MAX_SUBMISSIONS_PER_HOUR = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const timestamps = RATE_LIMIT.get(ip) ?? [];
  const recent = timestamps.filter((t) => t > hourAgo);
  RATE_LIMIT.set(ip, recent);
  return recent.length >= MAX_SUBMISSIONS_PER_HOUR;
}

function athletesLabel(v: string): string {
  const map: Record<string, string> = {
    less_than_50: "Menos de 50",
    "50_100": "50–100",
    "100_200": "100–200",
    "200_500": "200–500",
    more_than_500: "Más de 500",
  };
  return map[v] ?? v;
}

function planLabel(v: string | undefined): string {
  if (!v) return "No especificado";
  const map: Record<string, string> = {
    hierro: "Hierro",
    acero: "Acero",
    titanio: "Titanio",
    unsure: "No estoy seguro",
  };
  return map[v] ?? v;
}

function swLabel(v: string | undefined): string {
  if (!v) return "No especificado";
  const map: Record<string, string> = {
    wodify: "Wodify",
    pushpress: "PushPress",
    sugarwod: "SugarWOD",
    boxmagic: "Boxmagic",
    excel: "Excel + WhatsApp",
    other: "Otro",
    none: "Ninguno",
  };
  return map[v] ?? v;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { ok: false, error: "Demasiados intentos. Probá en una hora." },
        { status: 429 },
      );
    }

    const body = await req.json();

    // Honeypot
    if (body.website && String(body.website).length > 0) {
      return NextResponse.json({ ok: true });
    }

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos. Revisá los campos." },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Record rate limit
    const timestamps = RATE_LIMIT.get(ip) ?? [];
    timestamps.push(Date.now());
    RATE_LIMIT.set(ip, timestamps);

    // Save to DB
    const lead = await db.lead.create({
      data: {
        ownerName: data.ownerName,
        email: data.email,
        whatsapp: data.whatsapp,
        boxName: data.boxName,
        athletes: data.athletes,
        currentSw: data.currentSw ?? null,
        planInterest: data.planInterest ?? null,
        notes: data.notes ?? null,
        consent: data.consent,
        source: "landing",
        status: "new",
      },
    });

    // Send email to admin
    await sendEmail({
      to: [process.env.LEADS_EMAIL ?? "hola@kronos.app"],
      subject: `Nuevo lead · ${data.boxName} · ${athletesLabel(data.athletes)} atletas · ${planLabel(data.planInterest)}`,
      html: `<pre style="font-family:monospace;font-size:14px;line-height:1.6;color:#08080A">
Lead recibido:

  Owner:    ${data.ownerName}
  Email:    ${data.email}
  WhatsApp: ${data.whatsapp}
  Box:      ${data.boxName}
  Atletas:  ${athletesLabel(data.athletes)}
  Software: ${swLabel(data.currentSw)}
  Plan:     ${planLabel(data.planInterest)}

Notas:
${data.notes ?? "—"}

Ver en admin: https://kronos.app/admin/leads/${lead.id}
</pre>`,
    });

    // Send confirmation email to lead
    await sendEmail({
      to: [data.email],
      subject: "Recibimos tus datos · Kronos",
      html: `<div style="background:#08080A;color:#F5F5F7;font-family:Inter,system-ui,sans-serif;padding:48px 32px;max-width:600px;margin:0 auto">
  <p style="color:#C8FF2D;font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:24px">KRONOS</p>
  <h1 style="font-size:28px;font-weight:700;margin-bottom:20px">Recibimos tus datos</h1>
  <p style="color:#8A8A94;line-height:1.6;margin-bottom:16px">Hola ${data.ownerName},</p>
  <p style="color:#8A8A94;line-height:1.6;margin-bottom:16px">Recibimos tus datos para ${data.boxName}. En menos de 24 horas hábiles te escribimos por WhatsApp (${data.whatsapp}) para coordinar una demo de 20 minutos.</p>
  <p style="color:#8A8A94;line-height:1.6;margin-bottom:32px">Mientras tanto, si querés ver cómo se ve el admin en vivo: <a href="https://kronos.app/demo" style="color:#C8FF2D;text-decoration:none">https://kronos.app/demo</a></p>
  <p style="color:#54545C;font-size:13px;line-height:1.6">Cualquier cosa, respondé este email.</p>
  <p style="color:#54545C;font-size:13px;line-height:1.6;margin-top:24px">— Equipo Kronos<br/>hola@kronos.app</p>
</div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Lead submission error:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno. Probá de nuevo más tarde." },
      { status: 500 },
    );
  }
}
