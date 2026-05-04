// ═══════════════ DIRECTION 1: SANGRE — brutalismo deportivo ═══════════════

function SangreHome() {
  return (
    <div className="dir-sangre phone">
      <div className="island"></div>
      <div className="status">
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>6:42</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>•••••</span>
      </div>
      <div className="home-ind"></div>

      <div className="scroll">
        {/* HEADER — radical asymmetric */}
        <div style={{
          background: 'var(--blood)',
          padding: '64px 22px 22px',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div>
              <div className="mono" style={{
                fontSize: 11, color: '#000', letterSpacing: '0.16em', fontWeight: 700,
              }}>VIE / 02·MAY / 06:42</div>
              <div className="display" style={{
                fontSize: 84, color: '#000', marginTop: 12,
              }}>
                BUENOS<br/>DÍAS<span style={{ color: 'var(--bone)' }}>,</span>
              </div>
              <div className="display" style={{
                fontSize: 44, color: 'var(--bone)', marginTop: 4,
                textTransform: 'none', fontStyle: 'italic',
              }}>diego.</div>
            </div>
          </div>
        </div>

        {/* WOD HERO — newspaper layout */}
        <div style={{
          background: 'var(--bg)', padding: '24px 22px 28px',
          borderBottom: '6px solid var(--blood)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingBottom: 14,
            borderBottom: '1px solid var(--line)',
          }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em' }}>
              ▌ EL WOD DE HOY
            </span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.12em' }}>
              N.º 218
            </span>
          </div>

          <div className="display" style={{
            fontSize: 132, marginTop: 10, color: 'var(--bone)',
            letterSpacing: '-0.025em',
          }}>FRAN</div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 10,
            paddingTop: 6,
            alignItems: 'baseline',
          }}>
            <div className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--blood)', letterSpacing: '0.1em' }}>
              [ FOR TIME · BENCHMARK ]
            </div>
            <div className="display" style={{ fontSize: 30, color: 'var(--bone)' }}>
              21·15·9
            </div>
          </div>

          {/* movements with brutal numbering */}
          <div style={{ marginTop: 22 }}>
            {[
              { n: 'A', name: 'THRUSTERS', spec: '43 / 30 KG' },
              { n: 'B', name: 'PULL-UPS', spec: 'STRICT · BANDA' },
            ].map((m, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr auto',
                gap: 14, alignItems: 'center',
                padding: '16px 0',
                borderTop: '1px solid var(--line)',
                borderBottom: i === 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div className="display" style={{
                  fontSize: 38, color: 'var(--blood)', lineHeight: 1,
                }}>{m.n}</div>
                <div className="display" style={{
                  fontSize: 24, color: 'var(--bone)',
                }}>{m.name}</div>
                <div className="mono" style={{
                  fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.08em',
                }}>{m.spec}</div>
              </div>
            ))}
          </div>

          {/* coach quote */}
          <div style={{ marginTop: 18, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, background: 'var(--bone)', color: 'var(--bg)',
              fontFamily: 'Anton', fontSize: 16, fontWeight: 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>RP</div>
            <div style={{
              fontFamily: 'Newsreader', fontStyle: 'italic', fontSize: 15,
              color: 'var(--ink-mute)', lineHeight: 1.4,
            }}>
              "Termina rápido. Peso que te permita series ininterrumpidas.
              <span style={{ display: 'block', marginTop: 4, fontSize: 11, fontStyle: 'normal', color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono' }}>
                — Renata, coach
              </span>"
            </div>
          </div>
        </div>

        {/* RESERVA */}
        <div style={{ padding: '24px 22px', background: 'var(--bone)', color: '#000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', fontWeight: 700 }}>
                TU PRÓXIMA CLASE
              </div>
              <div className="display" style={{ fontSize: 86, marginTop: 6, lineHeight: 0.9 }}>
                12:00
              </div>
              <div className="mono" style={{ fontSize: 11, marginTop: 6, fontWeight: 500 }}>
                EN 5 H 18 M · ANDRÉS L. · 8/14
              </div>
            </div>
          </div>
          <button style={{
            marginTop: 18, width: '100%', padding: '20px',
            background: 'var(--blood)', color: 'var(--bone)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Anton', fontSize: 22, letterSpacing: '0.04em',
            textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px',
          }}>
            <span>INICIAR ENTRENO</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 14 }}>→</span>
          </button>
        </div>

        {/* SEMANA STRIP */}
        <div style={{ padding: '24px 22px', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em' }}>
              ▌ SEMANA · 3/5
            </span>
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-mute)' }}>60% META</span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
            {['L','M','M','J','V','S','D'].map((d, i) => {
              const done = [0,2,3].includes(i);
              const today = i === 4;
              return (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{
                    height: 56, background: done ? 'var(--blood)' : (today ? 'var(--bg-2)' : 'transparent'),
                    border: done ? 'none' : '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="display" style={{
                      fontSize: 22,
                      color: done ? 'var(--bone)' : (today ? 'var(--blood)' : 'var(--ink-faint)'),
                    }}>{d}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PR ROW */}
        <div style={{ padding: '24px 22px', background: 'var(--bg)', borderTop: '1px solid var(--line)' }}>
          <div className="mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', marginBottom: 14 }}>
            ▌ ÚLTIMOS RÉCORDS
          </div>
          {[
            { mov: 'BACK SQUAT', val: '142.5', u: 'KG', d: '+5.0', date: '18·ABR' },
            { mov: 'FRAN', val: '6:42', u: '', d: '−0:36', date: '12·NOV' },
            { mov: 'CLEAN & JERK', val: '95', u: 'KG', d: '+2.5', date: '02·MAR' },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: 14, alignItems: 'baseline', padding: '14px 0',
              borderTop: '1px solid var(--line)',
            }}>
              <div className="display" style={{ fontSize: 18, color: 'var(--bone)' }}>{p.mov}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--blood)', fontWeight: 700 }}>{p.d}</div>
              <div className="display" style={{ fontSize: 28, color: 'var(--bone)' }}>
                {p.val}<span style={{ fontSize: 12, color: 'var(--ink-mute)', marginLeft: 4 }}>{p.u}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 80 }}/>
      </div>
    </div>
  );
}

function SangreWod() {
  return (
    <div className="dir-sangre phone">
      <div className="island"></div>
      <div className="status">
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>6:42</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>•••••</span>
      </div>
      <div className="home-ind"></div>

      <div className="scroll">
        {/* top bar */}
        <div style={{
          padding: '60px 22px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg)',
        }}>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--bone)', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.12em', fontWeight: 600 }}>
            ← VOLVER
          </button>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.12em' }}>02·MAY · 12:00</span>
        </div>

        {/* MASSIVE TITLE */}
        <div style={{ background: 'var(--bg)', padding: '24px 22px 0' }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--blood)', fontWeight: 700, letterSpacing: '0.18em' }}>
            ▌ THE GIRLS · BENCHMARK
          </div>
          <div className="display" style={{
            fontSize: 200, color: 'var(--bone)', marginTop: 18,
            letterSpacing: '-0.04em',
          }}>FRAN</div>
        </div>

        {/* spec strip */}
        <div style={{
          background: 'var(--blood)', color: '#000',
          padding: '18px 22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span className="display" style={{ fontSize: 28 }}>FOR TIME</span>
          <span className="display" style={{ fontSize: 36 }}>21·15·9</span>
        </div>

        {/* Movements */}
        <div style={{ background: 'var(--bg)', padding: '0 22px' }}>
          {[
            { n: '01', name: 'THRUSTERS', spec: '43 / 30 KG', hint: 'FRONT RACK AL OVERHEAD' },
            { n: '02', name: 'PULL-UPS', spec: 'STRICT · BANDA', hint: 'MENTÓN SOBRE LA BARRA' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '24px 0',
              borderBottom: '1px solid var(--line)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600 }}>
                  {m.n} / 02
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--blood)', fontWeight: 700, letterSpacing: '0.08em' }}>
                  {m.spec}
                </div>
              </div>
              <div className="display" style={{
                fontSize: 56, color: 'var(--bone)', marginTop: 6,
              }}>{m.name}</div>
              <div className="mono" style={{
                fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.14em', marginTop: 6,
              }}>{m.hint}</div>
            </div>
          ))}
        </div>

        {/* PR card */}
        <div style={{ background: 'var(--bone)', color: '#000', padding: '24px 22px' }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', fontWeight: 700 }}>
            ▌ TU MEJOR MARCA
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
            <div className="display" style={{ fontSize: 96, lineHeight: 0.9 }}>6:42</div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 10, fontWeight: 700, color: 'var(--blood)', letterSpacing: '0.1em' }}>
                12·NOV·2025 · RX
              </div>
              <div className="mono" style={{ fontSize: 10, marginTop: 4 }}>3 INTENTOS PREVIOS</div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { t: '6:42', d: '12·NOV·25', rx: true },
              { t: '7:18', d: '08·ABR·25', rx: true },
              { t: '8:04', d: '14·OCT·24', rx: false },
            ].map((h, i) => (
              <div key={i} style={{
                background: i === 0 ? 'var(--blood)' : 'transparent',
                color: i === 0 ? 'var(--bone)' : '#000',
                border: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.18)',
                padding: '12px 10px',
              }}>
                <div className="display" style={{ fontSize: 22 }}>{h.t}</div>
                <div className="mono" style={{ fontSize: 8, marginTop: 4, letterSpacing: '0.08em', fontWeight: 600 }}>
                  {h.d} · {h.rx ? 'RX' : 'SC'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ background: 'var(--bg)', padding: '24px 22px 40px' }}>
          <button style={{
            width: '100%', padding: '24px',
            background: 'var(--blood)', color: 'var(--bone)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Anton', fontSize: 24, letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}>COMENZAR CRONÓMETRO ▶</button>
          <button style={{
            width: '100%', padding: '20px', marginTop: 8,
            background: 'transparent', color: 'var(--bone)',
            border: '1px solid var(--line)', cursor: 'pointer',
            fontFamily: 'IBM Plex Mono', fontSize: 12, letterSpacing: '0.16em', fontWeight: 600,
          }}>REGISTRAR MARCA MANUAL</button>
        </div>
      </div>
    </div>
  );
}

window.SangreHome = SangreHome;
window.SangreWod = SangreWod;
