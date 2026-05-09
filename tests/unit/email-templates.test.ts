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
  it("incluye email del recipient + URL clickeable", () => {
    const html = renderMagicLinkEmail({
      email: "owner@box.com",
      url: "https://kronos-fit.com/api/auth/callback/email?token=xyz",
    });
    expect(html).toContain("owner@box.com");
    expect(html).toContain(
      "https://kronos-fit.com/api/auth/callback/email?token=xyz",
    );
    expect(html).toContain("Entrar a Kronos");
  });

  it("escapa email para prevenir XSS en cuerpo", () => {
    const html = renderMagicLinkEmail({
      email: "<script>x</script>@evil.com",
      url: "https://safe.url",
    });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toMatch(/<script>x<\/script>/);
  });
});

describe("renderMagicLinkText", () => {
  it("plain text fallback contiene email + url + instrucciones", () => {
    const text = renderMagicLinkText({
      email: "owner@box.com",
      url: "https://kronos-fit.com/x",
    });
    expect(text).toContain("owner@box.com");
    expect(text).toContain("https://kronos-fit.com/x");
    expect(text).toContain("expira en 24h");
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
