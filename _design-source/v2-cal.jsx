// ═══════════════ DIRECTION 3: CAL — print editorial luminoso ═══════════════

function CalHome() {
  return (
    <div className="dir-cal phone">
      <div className="island"></div>
      <div className="status">
        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>6:42</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 500 }}>•••••</span>
      </div>
      <div className="home-ind"></div>

      <div className="scroll" style={{ background: 'var(--paper)' }}>
        {/* MASTHEAD */}
        <div style={{
          padding: '60px 22px 14px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <div className="display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.32em' }}>
            KRONOS
          </div>
          <div className="mono" style={{ fontSize: 9, letterSpacing: '0.14em' }}>
            VOL. III · NO. 218
          </div>
        </div>

        {/* DATELINE */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', fontWeight: 500 }}>
            VIERNES 02 MAYO 2026
          </span>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--ink-mute)' }}>
            CDMX · SOL · 18°
          </span>
        </div>

        {/* HERO STORY */}
        <div style={{ padding: '24px 22px 8px' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--hot)', fontWeight: 700, letterSpacing: '0.18em' }}>
            ▌ ENTRENO DEL DÍA
          </div>
          <div className="display" style={{
            fontSize: 96, marginTop: 12, lineHeight: 0.86,
          }}>
            <span style={{ fontStyle: 'italic' }}>Fran</span>
            <span style={{ color: 'var(--hot)' }}>.</span>
          </div>
          <div className="display" style={{
            fontSize: 28, marginTop: 12, fontWeight: 600,
            fontStyle: 'italic', color: 'var(--ink-mute)',
          }}>
            21 · 15 · 9, contra el reloj.
          </div>
          <p className="ui" style={{
            fontSize: 14, marginTop: 14, lineHeight: 1.55, color: 'var(--ink-mute)',
            fontFamily: 'Newsreader',
          }}>
            Termina rápido. Elige peso que te permita series ininterrumpidas.
            El primer round es más lento de lo que crees.
            <span style={{ display: 'block', marginTop: 6, fontSize: 11, fontFamily: 'JetBrains Mono', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--ink-faint)' }}>
              — Renata Pacheco, coach a cargo
            </span>
          </p>
        </div>

        {/* PROGRAMA */}
        <div style={{ padding: '0 22px 24px' }}>
          <div style={{ height: 1, background: 'var(--ink)', marginTop: 18, marginBottom: 14 }}/>
          {[
            { n: 'I', name: 'Thrusters', spec: '43 / 30 kg', hint: 'Front rack al overhead' },
            { n: 'II', name: 'Pull-ups', spec: 'Strict · banda', hint: 'Mentón sobre la barra' },
          ].map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr auto',
              gap: 14, alignItems: 'baseline',
              padding: '14px 0',
              borderTop: i === 0 ? 'none' : '0.5px solid var(--line)',
            }}>
              <div className="display" style={{ fontSize: 24, fontStyle: 'italic', color: 'var(--hot)' }}>
                {m.n}.
              </div>
              <div>
                <div className="display" style={{ fontSize: 26, lineHeight: 1 }}>{m.name}</div>
                <div className="ui" style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>
                  {m.hint}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', whiteSpace: 'nowrap' }}>
                {m.spec}
              </div>
            </div>
          ))}
        </div>

        {/* RESERVATION CARD — paper ticket */}
        <div style={{
          margin: '0 22px',
          background: 'var(--ink)', color: 'var(--paper)',
          padding: '20px 20px 18px',
          position: 'relative',
        }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.16em', fontWeight: 600, opacity: 0.7 }}>
            BOLETO · CLASE 12:00
          </div>
          <div className="display" style={{
            fontSize: 80, marginTop: 10, lineHeight: 0.92, color: 'var(--paper)',
          }}>12:00</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
            <span className="mono" style={{ fontSize: 11, opacity: 0.85 }}>EN 5 H 18 M</span>
            <span className="mono" style={{ fontSize: 11, opacity: 0.85 }}>ANDRÉS L. · 8/14</span>
          </div>
          <div style={{ height: 1, background: 'var(--paper)', opacity: 0.25, marginTop: 14 }}/>
          <button style={{
            marginTop: 14, width: '100%', padding: 14,
            background: 'var(--hot)', color: 'var(--paper)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Newsreader', fontStyle: 'italic', fontWeight: 600, fontSize: 18,
          }}>
            Iniciar entreno →
          </button>
        </div>

        {/* SECTION RULE */}
        <div style={{ padding: '32px 22px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="display" style={{ fontSize: 22, fontStyle: 'italic' }}>Tu semana</span>
          <div style={{ flex: 1, height: 1, background: 'var(--ink)' }}/>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600 }}>3/5</span>
        </div>

        <div style={{ padding: '14px 22px 0', display: 'flex', gap: 6 }}>
          {['L','M','M','J','V','S','D'].map((d, i) => {
            const done = [0,2,3].includes(i);
            const today = i === 4;
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--ink-faint)', marginBottom: 6 }}>
                  {d}
                </div>
                <div style={{
                  height: 50,
                  background: done ? 'var(--ink)' : (today ? 'var(--hot)' : 'transparent'),
                  border: done || today ? 'none' : '1px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Newsreader', fontStyle: 'italic',
                  fontSize: 16, fontWeight: 600,
                  color: done || today ? 'var(--paper)' : 'var(--ink-faint)',
                }}>
                  {done ? '×' : (today ? 'hoy' : '·')}
                </div>
              </div>
            );
          })}
        </div>

        {/* ÚLTIMOS RÉCORDS — newspaper columns */}
        <div style={{ padding: '32px 22px 0', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="display" style={{ fontSize: 22, fontStyle: 'italic' }}>Últimos récords</span>
          <div style={{ flex: 1, height: 1, background: 'var(--ink)' }}/>
        </div>

        <div style={{ padding: '14px 22px' }}>
          {[
            { mov: 'Back Squat', val: '142.5', u: 'kg', d: '+5.0', date: '18 abr 2026', neg: false },
            { mov: 'Fran', val: '6:42', u: '', d: '−0:36', date: '12 nov 2025', neg: true },
            { mov: 'Clean & Jerk', val: '95', u: 'kg', d: '+2.5', date: '02 mar 2026', neg: false },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: 14, alignItems: 'baseline',
              padding: '14px 0',
              borderTop: '0.5px solid var(--line)',
            }}>
              <div>
                <div className="display" style={{ fontSize: 22, fontStyle: 'italic' }}>{p.mov}</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--ink-faint)', marginTop: 2 }}>
                  {p.date.toUpperCase()}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--hot)', fontWeight: 600 }}>{p.d}</div>
              <div className="display" style={{ fontSize: 28, minWidth: 80, textAlign: 'right' }}>
                {p.val}<span className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', marginLeft: 4, fontWeight: 500 }}>{p.u}</span>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER COLOPHON */}
        <div style={{
          padding: '24px 22px 80px',
          borderTop: '4px double var(--ink)',
          marginTop: 14,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--ink-mute)' }}>
            DIEGO V. · ATLETA
          </span>
          <span className="mono" style={{ fontSize: 9, letterSpacing: '0.14em', color: 'var(--ink-mute)' }}>
            BOX. CDMX · MMXXVI
          </span>
        </div>
      </div>
    </div>
  );
}

function CalWod() {
  return (
    <div className="dir-cal phone">
      <div className="island"></div>
      <div className="status">
        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>6:42</span>
        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 500 }}>•••••</span>
      </div>
      <div className="home-ind"></div>

      <div className="scroll" style={{ background: 'var(--paper)' }}>
        {/* TOP */}
        <div style={{
          padding: '60px 22px 12px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--ink)', cursor: 'pointer', fontFamily: 'Newsreader', fontStyle: 'italic', fontSize: 16, fontWeight: 600 }}>
            ← volver
          </button>
          <span className="mono" style={{ fontSize: 10, letterSpacing: '0.12em' }}>VIE 02 MAY · 12:00</span>
        </div>

        {/* MASTHEAD */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--hot)', fontWeight: 700, letterSpacing: '0.18em' }}>
            ▌ THE GIRLS · BENCHMARK
          </div>
          <div className="display" style={{
            fontSize: 184, marginTop: 18, lineHeight: 0.84,
            fontStyle: 'italic',
          }}>Fran<span style={{ color: 'var(--hot)', fontStyle: 'normal' }}>.</span></div>
        </div>

        {/* lede */}
        <div style={{ padding: '20px 22px 0' }}>
          <div className="display" style={{
            fontSize: 26, fontWeight: 600, color: 'var(--ink-mute)',
            fontStyle: 'italic',
          }}>
            For time. 21 · 15 · 9.
          </div>
          <p className="ui" style={{
            fontSize: 14, marginTop: 12, lineHeight: 1.55,
            fontFamily: 'Newsreader',
          }}>
            La benchmark más corta y más temida. Tres rondas que se sienten
            como diez. Dos movimientos, un objetivo: terminar.
          </p>
        </div>

        {/* programa con números editoriales */}
        <div style={{ padding: '24px 22px 0' }}>
          <div style={{ height: 1, background: 'var(--ink)' }}/>
          {[
            { n: 'I', name: 'Thrusters', spec: '43 / 30 kg', hint: 'Front rack al overhead' },
            { n: 'II', name: 'Pull-ups', spec: 'Strict · banda', hint: 'Mentón sobre la barra' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '20px 0',
              borderBottom: '0.5px solid var(--line)',
              display: 'grid', gridTemplateColumns: '50px 1fr',
              gap: 14,
            }}>
              <div className="display" style={{ fontSize: 36, fontStyle: 'italic', color: 'var(--hot)' }}>
                {m.n}.
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div className="display" style={{ fontSize: 38 }}>{m.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{m.spec}</div>
                </div>
                <div className="ui" style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6, fontFamily: 'Newsreader', fontStyle: 'italic' }}>
                  {m.hint}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PR — pull quote style */}
        <div style={{ padding: '28px 22px 0' }}>
          <div className="mono" style={{ fontSize: 10, color: 'var(--hot)', fontWeight: 700, letterSpacing: '0.18em' }}>
            ▌ TU MEJOR MARCA
          </div>
          <div className="display" style={{
            fontSize: 96, marginTop: 10, lineHeight: 0.9,
            fontFamily: 'JetBrains Mono', fontWeight: 700,
            letterSpacing: '-0.02em',
          }}>6:42</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.1em', marginTop: 6 }}>
            RX · 12 NOV 2025 · 3 INTENTOS PREVIOS
          </div>

          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { t: '6:42', d: '12 NOV 25', rx: 'RX' },
              { t: '7:18', d: '08 ABR 25', rx: 'RX' },
              { t: '8:04', d: '14 OCT 24', rx: 'SC' },
            ].map((h, i) => (
              <div key={i} style={{
                background: i === 0 ? 'var(--ink)' : 'transparent',
                color: i === 0 ? 'var(--paper)' : 'var(--ink)',
                border: i === 0 ? 'none' : '1px solid var(--line)',
                padding: '12px 10px',
              }}>
                <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{h.t}</div>
                <div className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', marginTop: 4, opacity: 0.8 }}>
                  {h.d} · {h.rx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '28px 22px 50px' }}>
          <button style={{
            width: '100%', padding: 22,
            background: 'var(--hot)', color: 'var(--paper)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'Newsreader', fontStyle: 'italic', fontWeight: 700, fontSize: 22,
          }}>
            Comenzar cronómetro →
          </button>
          <button style={{
            width: '100%', padding: 18, marginTop: 8,
            background: 'transparent', color: 'var(--ink)',
            border: '1px solid var(--line)', cursor: 'pointer',
            fontFamily: 'Newsreader', fontStyle: 'italic', fontSize: 16, fontWeight: 600,
          }}>
            Registrar marca manual
          </button>
        </div>
      </div>
    </div>
  );
}

window.CalHome = CalHome;
window.CalWod = CalWod;
