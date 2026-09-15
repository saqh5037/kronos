/**
 * Guardia de verdad de la superficie pública (audit 2026-09-15).
 *
 * Este test lee los archivos reales de la landing, los legales, las
 * invitaciones y la pantalla de TV, y falla si vuelve a aparecer un claim que
 * el producto no entrega, un testimonio inventado o voseo argentino.
 *
 * Es un test de escaneo a propósito: las correcciones de copy no tienen
 * comportamiento que probar, pero sí tienen regresiones que evitar. Los sweeps
 * visuales del proyecto ya se han comido cambios antes, y la landing es lo que
 * el dueño de box lee antes de firmar.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import {
  TRIAL_DAYS,
  CTA_TRIAL_LABEL,
  CTA_WHATSAPP_LABEL,
  buildWhatsappUrl,
  whatsappHrefOrAnchor,
  LEAD_FORM_ANCHOR,
} from "@/app/(landing)/_data/cta";
import { PRICING, ROADMAP, FOOTER_LINKS } from "@/app/(landing)/_data/mock";
import { TRIAL_DURATION_DAYS } from "@/lib/validations/signup";

// Anclado al archivo de test, no a `process.cwd()`: así corre igual desde la
// raíz del repo, desde un worktree o desde donde sea que lo invoque CI.
const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const APP = join(REPO_ROOT, "src", "app");

/** Superficie pública bajo revisión. */
const SCANNED_DIRS = [
  join(APP, "(landing)"),
  join(APP, "(public)"),
  join(APP, "(auth)"),
  join(APP, "legal"),
  join(APP, "invitacion"),
  join(APP, "invitacion-staff"),
  join(APP, "tv"),
  join(APP, "eventos"),
  join(APP, "logout"),
];

const SOURCE_EXTENSIONS = [".ts", ".tsx", ".css"];

/**
 * Los comentarios NO son copy. Este archivo y los archivos que escanea explican
 * por qué cada claim está prohibido, y esas explicaciones necesitan nombrarlo:
 * si no descontáramos los comentarios, documentar la regla la rompería.
 */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
}

/**
 * El bloque "En el roadmap" es el ÚNICO lugar donde puede vivir algo no
 * lanzado, así que se descuenta del escaneo. Lo que no puede pasar es que esas
 * mismas cadenas se filtren a las viñetas de un plan; eso lo cubre el bloque de
 * tests del roadmap más abajo.
 */
function stripRoadmap(text: string): string {
  return text.replace(/export const ROADMAP[\s\S]*?\n\];/, "");
}

function collectFiles(dir: string): string[] {
  let out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out = out.concat(collectFiles(full));
      continue;
    }
    if (SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) out.push(full);
  }
  return out;
}

const FILES: Array<{ path: string; raw: string; text: string }> =
  SCANNED_DIRS.flatMap((dir) => collectFiles(dir)).map((path) => {
    const relative = path.slice(REPO_ROOT.length + 1);
    const raw = readFileSync(path, "utf8");
    return {
      path: relative,
      raw,
      text: stripRoadmap(stripComments(raw)),
    };
  });

/** Encuentra `needle` en la superficie escaneada y reporta dónde. */
function findLiteral(needle: string): string[] {
  return FILES.filter((f) => f.text.includes(needle)).map((f) => f.path);
}

function findPattern(re: RegExp): string[] {
  return FILES.filter((f) => re.test(f.text)).map((f) => f.path);
}

describe("superficie pública — archivos escaneados", () => {
  it("encuentra la landing, los legales, las invitaciones y la pantalla de TV", () => {
    expect(FILES.length).toBeGreaterThan(40);
    for (const expected of [
      "src/app/(landing)/_data/mock.ts",
      "src/app/(landing)/_data/cta.ts",
      "src/app/legal/terminos/page.tsx",
      "src/app/legal/privacidad/page.tsx",
      "src/app/invitacion/[token]/page.tsx",
      "src/app/invitacion-staff/[token]/page.tsx",
      "src/app/tv/[slug]/page.tsx",
    ]) {
      expect(FILES.map((f) => f.path)).toContain(expected);
    }
  });
});

describe("claims que el producto no entrega", () => {
  // Cada entrada vuelve a la superficie solo cuando el producto la entregue.
  // Si algo de aquí se lanza, se quita de la lista Y se agrega a las viñetas.
  const BANNED = [
    "Stripe",
    "OXXO",
    "SPEI",
    "CFDI",
    "nómina",
    "App Store",
    "Play Store",
    "API pública",
    "SSO",
    "SLA 99",
    "12 semanas",
    "EJEMPLO ILUSTRATIVO",
    "PRÓX.",
  ];

  it.each(BANNED)("no aparece %s en ningún archivo público", (claim) => {
    expect(findLiteral(claim)).toEqual([]);
  });

  it("no promete Apple Developer Account ni apps publicadas en tiendas", () => {
    expect(findPattern(/Apple Developer/i)).toEqual([]);
  });

  it("los pagos se describen como Mercado Pago y efectivo", () => {
    const pricing = PRICING.flatMap((tier) => tier.features).join(" ");
    expect(pricing).toMatch(/Mercado Pago/);
    expect(pricing).toMatch(/efectivo/);
  });
});

describe("el roadmap es el único lugar donde viven las cosas no lanzadas", () => {
  it("ninguna viñeta de plan promete algo del roadmap", () => {
    const bullets = PRICING.flatMap((tier) => tier.features);
    for (const planned of ROADMAP) {
      expect(bullets).not.toContain(planned);
    }
  });

  it("el roadmap sí nombra lo aplazado, para que no vuelva a los planes", () => {
    const roadmap = ROADMAP.join(" ");
    expect(roadmap).toMatch(/CFDI/);
    expect(roadmap).toMatch(/tiendas/);
  });

  it("las viñetas contractuales solo listan lo que ya opera", () => {
    const bullets = PRICING.flatMap((tier) => tier.features).join(" ");
    expect(bullets).toMatch(/lista de espera/i);
    expect(bullets).toMatch(/WOD del día/i);
    expect(bullets).toMatch(/asistencia/i);
    expect(bullets).toMatch(/PRs/);
    expect(bullets).toMatch(/CSV/);
    expect(bullets).toMatch(/GRATIS/);
  });
});

describe("una sola prueba, dos CTAs", () => {
  it("TRIAL_DAYS es 14", () => {
    expect(TRIAL_DAYS).toBe(14);
  });

  it("coincide con lo que el alta realmente provisiona", () => {
    // Si alguien cambia la duración real del trial, la landing deja de mentir
    // al mismo tiempo en vez de un release después.
    expect(TRIAL_DAYS).toBe(TRIAL_DURATION_DAYS);
  });

  it("no queda ninguna prueba de 30 días en la superficie de venta", () => {
    // El contrato de piloto-beta es otra cosa y tiene sus propios 30 días; lo
    // que no puede pasar es que la landing y /signup se contradigan.
    const salesSurface = FILES.filter(
      (f) =>
        f.path.startsWith("src/app/(landing)/") ||
        f.path.startsWith("src/app/(auth)/") ||
        f.path.startsWith("src/app/(public)/signup/"),
    );
    const offenders = salesSurface.filter((f) =>
      /(prueba|trial|gratis|probar)[^.]{0,40}30\s*d[ií]as|30\s*d[ií]as[^.]{0,40}(gratis|sin cargo|sin tarjeta)/i.test(
        f.text,
      ),
    );
    expect(offenders.map((f) => f.path)).toEqual([]);
  });

  it("las etiquetas de CTA se derivan de TRIAL_DAYS", () => {
    expect(CTA_TRIAL_LABEL).toBe("Empezar prueba de 14 días");
    expect(CTA_WHATSAPP_LABEL).toBe("Hablar por WhatsApp");
  });

  it("ya no existen las cinco etiquetas viejas", () => {
    for (const label of [
      "RESERVAR LUGAR",
      "Reservar lugar",
      "RESERVAR DEMO",
      "Reservar demo",
      "HABLAR CON VENTAS",
      "Hablar con ventas",
      "RESERVAR MI LUGAR",
    ]) {
      expect(findLiteral(label)).toEqual([]);
    }
  });

  it("cada plan usa una de las dos etiquetas permitidas", () => {
    for (const tier of PRICING) {
      expect([CTA_TRIAL_LABEL, CTA_WHATSAPP_LABEL]).toContain(tier.cta);
    }
  });
});

describe("dialecto: español mexicano neutro", () => {
  const VOSEO =
    /(pedile|cancelás|empezá|recibís|tenés|querés|acá\b|mantené|subí\b)/i;

  it("no hay voseo argentino en la superficie pública", () => {
    expect(findPattern(VOSEO)).toEqual([]);
  });

  it("tampoco las formas que ya se habían colado", () => {
    expect(findPattern(/\biniciá\b/i)).toEqual([]);
    expect(findPattern(/\bfijate\b|\bmirá\b|\bacordate\b/i)).toEqual([]);
  });
});

describe("nada de pruebas fabricadas", () => {
  it("no hay testimonios con nombre y ciudad inventados", () => {
    for (const fake of ["DANIEL R.", "MARIANA V.", "RICARDO H."]) {
      expect(findLiteral(fake)).toEqual([]);
    }
  });

  it("las paletas no atribuyen boxes que no son clientes", () => {
    for (const fake of ["Califa CrossFit", "Alpha Box", "Húsares"]) {
      expect(findLiteral(fake)).toEqual([]);
    }
  });

  it("el footer no enlaza páginas que no existen", () => {
    for (const link of FOOTER_LINKS.recursos) {
      expect(link.href).not.toBe("#");
      expect(link.href.startsWith("/")).toBe(true);
    }
  });
});

describe("México, no LATAM", () => {
  it("la superficie pública no se vende como producto LATAM", () => {
    expect(findLiteral("LATAM")).toEqual([]);
  });
});

describe("visible sin JS y sin scroll", () => {
  const SSR_CRITICAL = [
    "src/app/(landing)/_components/router/RouterSplit.tsx",
    "src/app/(landing)/_components/Hero.tsx",
    "src/app/(landing)/atletas/_components/AtletaHero.tsx",
    "src/app/(landing)/atletas/_components/BenefitSection.tsx",
    "src/app/(landing)/atletas/_components/AtletaSiNo.tsx",
  ];

  it.each(SSR_CRITICAL)(
    "%s no esconde contenido detrás de initial=hidden",
    (path) => {
      const file = FILES.find((f) => f.path === path);
      expect(file, `falta ${path}`).toBeDefined();
      expect(file!.text).not.toMatch(/initial=["']hidden["']/);
    },
  );

  it("la entrada CSS existe y es visible en reposo", () => {
    const css = FILES.find(
      (f) => f.path === "src/app/(landing)/landing.css",
    )!.text;
    expect(css).toMatch(/\.lp-rise\s*\{[^}]*opacity:\s*1/);
    expect(css).toMatch(/prefers-reduced-motion:\s*no-preference/);
  });
});

describe("constructor de la URL de WhatsApp", () => {
  it("arma wa.me con solo los dígitos", () => {
    expect(buildWhatsappUrl("+52 55 1234 5678")).toBe(
      "https://wa.me/525512345678",
    );
  });

  it("codifica el mensaje", () => {
    expect(buildWhatsappUrl("5215512345678", "Hola, tengo un box")).toBe(
      "https://wa.me/5215512345678?text=Hola%2C%20tengo%20un%20box",
    );
  });

  it("devuelve null cuando no hay número que marcar", () => {
    expect(buildWhatsappUrl(undefined)).toBeNull();
    expect(buildWhatsappUrl("")).toBeNull();
    expect(buildWhatsappUrl(null)).toBeNull();
    expect(buildWhatsappUrl("  ")).toBeNull();
    expect(buildWhatsappUrl("sin dígitos")).toBeNull();
  });

  it("cae al formulario cuando el número no está configurado", () => {
    expect(whatsappHrefOrAnchor("")).toBe(LEAD_FORM_ANCHOR);
    expect(whatsappHrefOrAnchor(undefined)).toBe(LEAD_FORM_ANCHOR);
  });

  it("usa WhatsApp cuando sí está configurado", () => {
    expect(whatsappHrefOrAnchor("+52 55 1234 5678")).toBe(
      "https://wa.me/525512345678",
    );
  });
});
