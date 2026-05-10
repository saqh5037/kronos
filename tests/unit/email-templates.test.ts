import { describe, it, expect } from "vitest";
import {
  renderMagicLinkEmail,
  renderMagicLinkText,
} from "@/server/email-templates/magic-link";
import { renderStaffInvitationEmail } from "@/server/email-templates/staff-invitation";
import {
  escapeHtml,
  renderEmailLayout,
} from "@/server/email-templates/_layout";

describe("escapeHtml", () => {
  it('escapa <, >, &, "', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("escapa & primero (no crea doble-encoding)", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });
});

describe("renderEmailLayout", () => {
  it("incluye preheader oculto y body", () => {
    const html = renderEmailLayout({
      preheader: "Hola mundo",
      body: "<p>Body content</p>",
    });
    expect(html).toContain("Hola mundo");
    expect(html).toContain("<p>Body content</p>");
    expect(html).toContain("display:none"); // preheader oculto
  });

  it("escapa preheader (no permite HTML injection en preview)", () => {
    const html = renderEmailLayout({
      preheader: '<img onerror="alert(1)">',
      body: "x",
    });
    expect(html).toContain("&lt;img");
    expect(html).not.toContain('<img onerror="alert(1)">');
  });

  it("body no se escapa (permite HTML estructurado)", () => {
    const html = renderEmailLayout({
      preheader: "x",
      body: "<a href='https://example.com'>link</a>",
    });
    expect(html).toContain("<a href='https://example.com'>link</a>");
  });

  it("incluye header KRONOS + footer kronos-fit.com", () => {
    const html = renderEmailLayout({ preheader: "x", body: "x" });
    expect(html).toContain("KRONOS");
    expect(html).toContain("kronos-fit.com");
  });

  it("showPromoBanner=false suprime el banner aun en periodo activo", () => {
    const html = renderEmailLayout({
      preheader: "x",
      body: "x",
      showPromoBanner: false,
    });
    expect(html).not.toContain("Founding Box Dominus");
  });
});

describe("renderMagicLinkEmail", () => {
  it("incluye email del recipient + magic link fallback + código formateado + link otp-redirect", () => {
    const html = renderMagicLinkEmail({
      email: "owner@box.com",
      url: "https://kronos-fit.com/api/auth/callback/email?token=xyz",
      code: "123456",
    });
    expect(html).toContain("owner@box.com");
    expect(html).toContain(
      "https://kronos-fit.com/api/auth/callback/email?token=xyz",
    );
    // CTA primario es OTP redirect, magic link queda como fallback secundario
    expect(html).toContain("Copiar código y abrir Kronos");
    expect(html).toContain("/login/otp");
    // Código se muestra formato "123 456"
    expect(html).toContain("123 456");
  });

  it("escapa email para prevenir XSS en cuerpo", () => {
    const html = renderMagicLinkEmail({
      email: "<script>x</script>@evil.com",
      url: "https://safe.url",
      code: "000000",
    });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toMatch(/<script>x<\/script>/);
  });
});

describe("renderMagicLinkText", () => {
  it("plain text contiene email + magic link + código + iOS one-time-code marker", () => {
    const text = renderMagicLinkText({
      email: "owner@box.com",
      url: "https://kronos-fit.com/x",
      code: "654321",
    });
    expect(text).toContain("owner@box.com");
    expect(text).toContain("https://kronos-fit.com/x");
    expect(text).toContain("válido 1h");
    expect(text).toContain("654 321");
    // Última línea formato `@<host> #<code>` para autofill iOS
    expect(text).toMatch(/@kronos-fit\.com #654321\s*$/);
    // Link tappable a /login/otp con código y email
    expect(text).toContain("/login/otp?");
    expect(text).toContain("code=654321");
  });
});

describe("renderStaffInvitationEmail", () => {
  it("incluye box name + role + link de activación", () => {
    const html = renderStaffInvitationEmail({
      boxName: "Iron Hands CrossFit",
      name: "Juan",
      role: "COACH",
      link: "https://kronos-fit.com/invite/abc",
    });
    expect(html).toContain("Iron Hands CrossFit");
    expect(html).toContain("Hola Juan");
    expect(html).toContain("coach");
    expect(html).toContain("https://kronos-fit.com/invite/abc");
  });

  it("greeting genérico cuando name es null", () => {
    const html = renderStaffInvitationEmail({
      boxName: "Box X",
      name: null,
      role: "STAFF",
      link: "https://x.com",
    });
    expect(html).toContain("Hola,");
    expect(html).not.toContain("Hola null");
  });

  it("escapa boxName y name (XSS prevention)", () => {
    const html = renderStaffInvitationEmail({
      boxName: "<img src=x>",
      name: '"><script>',
      role: "COACH",
      link: "https://x.com",
    });
    expect(html).toContain("&lt;img src=x&gt;");
    expect(html).toContain("&quot;&gt;&lt;script&gt;");
  });
});
