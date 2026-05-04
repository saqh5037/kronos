// Kronos — Pagos y membresía

function PaymentScreen() {
  return (
    <div className="screen-scroll">
      <div style={{ padding: '8px 22px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span className="eyebrow">Cuenta</span>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--marble-mute)', cursor: 'pointer', padding: 6 }}>
          {Icon.more(18)}
        </button>
      </div>

      <div style={{ padding: '14px 22px 0' }}>
        <div className="display" style={{ fontSize: 38, color: 'var(--marble)' }}>
          Membresía <span style={{ fontStyle: 'italic', color: 'var(--bronze)' }}>al día</span>
        </div>
      </div>

      {/* Plan card */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{
          background: '#0d0c0a', border: '0.5px solid var(--line-strong)',
          borderRadius: 16, padding: '20px 20px 18px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative tape */}
          <div style={{
            position: 'absolute', top: 0, right: 0,
            width: 110, height: 110, opacity: 0.5,
            background: 'radial-gradient(circle at top right, rgba(184,153,104,0.20), transparent 60%)',
            pointerEvents: 'none',
          }}/>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="eyebrow eyebrow-bronze">Plan vigente</div>
              <div className="display" style={{ fontSize: 30, color: 'var(--marble)', marginTop: 6, fontStyle: 'italic' }}>
                Ilimitado
              </div>
              <div className="caption" style={{ fontSize: 12, marginTop: 2 }}>Acceso completo · 7 días por semana</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 28, color: 'var(--marble)', fontWeight: 400, lineHeight: 1 }}>
                $1,650
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--marble-faint)', letterSpacing: '0.1em', marginTop: 2 }}>
                MXN / MES
              </div>
            </div>
          </div>

          <div style={{ height: 18 }}/>
          <div className="section-rule"/>

          {/* Next charge */}
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow">Próximo cobro</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span className="mono" style={{ fontSize: 18, color: 'var(--marble)' }}>14 MAY 2026</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--bronze)' }}>en 12 días</span>
              </div>
            </div>
            <div style={{
              background: 'var(--carbon-2)', borderRadius: 8,
              padding: '8px 12px', border: '0.5px solid var(--line)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ width: 22, height: 14, borderRadius: 2, background: 'linear-gradient(135deg, #d4a657, #8c6e3a)' }}/>
              <span className="mono" style={{ fontSize: 11, color: 'var(--marble)', letterSpacing: '0.04em' }}>
                •••• 4729
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Usage this period */}
      <div style={{ padding: '28px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <span className="eyebrow">Uso · período actual</span>
          <span className="num-tag">14 ABR — 13 MAY</span>
        </div>
        <div style={{
          background: 'var(--carbon-2)', border: '0.5px solid var(--line)',
          borderRadius: 12, padding: 18,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div className="display" style={{ fontSize: 56, color: 'var(--marble)', lineHeight: 1 }}>
                12
              </div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--marble-faint)', letterSpacing: '0.12em', marginTop: 6 }}>
                SESIONES
              </div>
            </div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--bronze)', textAlign: 'right' }}>
              VALOR PROMEDIO<br/>
              <span style={{ fontSize: 16, color: 'var(--marble)' }}>$137</span>
              <span style={{ fontSize: 10, color: 'var(--marble-faint)' }}> / sesión</span>
            </div>
          </div>
          <div style={{ marginTop: 22, display: 'flex', gap: 3 }}>
            {Array.from({ length: 22 }).map((_, i) => {
              const used = i < 12;
              return (
                <div key={i} style={{
                  flex: 1, height: 22, borderRadius: 2,
                  background: used ? 'var(--bronze)' : 'var(--carbon)',
                  opacity: used ? (0.5 + i * 0.04) : 0.6,
                }}/>
              );
            })}
          </div>
          <div style={{ marginTop: 10 }} className="caption">
            <span style={{ fontSize: 11 }}>10 días restantes en el período</span>
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ padding: '32px 22px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Historial de pagos</div>
        <div>
          {[
            { date: '14 ABR 2026', amount: '$1,650', state: 'pagado', method: '•••• 4729' },
            { date: '14 MAR 2026', amount: '$1,650', state: 'pagado', method: '•••• 4729' },
            { date: '14 FEB 2026', amount: '$1,650', state: 'pagado', method: '•••• 4729' },
            { date: '14 ENE 2026', amount: '$1,650', state: 'pagado', method: '•••• 4729' },
            { date: '14 DIC 2025', amount: '$1,500', state: 'pagado', method: '•••• 8843', plan: 'Plan anterior' },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
              padding: '14px 0',
              borderBottom: '0.5px solid var(--line)',
            }}>
              <div>
                <div className="mono" style={{ fontSize: 13, color: 'var(--marble)' }}>{p.date}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.08em', marginTop: 4 }}>
                  {p.plan ? p.plan.toUpperCase() : 'PLAN ILIMITADO'} · {p.method}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 16, color: 'var(--marble)' }}>{p.amount}</div>
                <div className="mono" style={{ fontSize: 9, color: 'var(--success)', letterSpacing: '0.1em', marginTop: 4 }}>
                  ✓ {p.state.toUpperCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manage */}
      <div style={{ padding: '24px 16px 0' }}>
        <button className="btn btn-ghost btn-block">Cambiar plan</button>
        <div style={{ height: 8 }}/>
        <button className="btn btn-ghost btn-block" style={{ color: 'var(--marble-mute)' }}>
          Pausar membresía
        </button>
        <div style={{ height: 14 }}/>
        <div className="caption" style={{ fontSize: 11, textAlign: 'center', color: 'var(--marble-faint)' }}>
          Facturación CFDI 4.0 disponible · Soporte: hola@kronos.mx
        </div>
      </div>

      <div style={{ height: 32 }}/>
    </div>
  );
}

Object.assign(window, { PaymentScreen });
