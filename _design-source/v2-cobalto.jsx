// ═══════════════ DIRECTION 2: COBALTO — telemetría / instrumento ═══════════════

function CobaltoHome() {
  return (
    <div className="dir-cobalto phone">
      <div className="island"></div>
      <div className="status">
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>06:42</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>•••••</span>
      </div>
      <div className="home-ind"></div>

      <div className="scroll">
        {/* HEADER STRIP */}
        <div style={{ padding: '60px 18px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-mute)', letterSpacing: '0.14em', fontWeight: 600 }}>
              [ KRONOS / ATHLETE ]
            </span>
            <span style={{ fontSize: 11, color: 'var(--signal)', fontWeight: 600 }}>● ONLINE</span>
          </div>
        </div>

        {/* HERO TELEMETRY */}
        <div style={{
          background: 'var(--cob)',
          padding: '20px 18px 24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
            <span>WOD.000218</span>
            <span>02·MAY·2026 / 06:42</span>
          </div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontWeight: 700,
            fontSize: 96, lineHeight: 0.9, marginTop: 18,
            color: '#fff', letterSpacing: '-0.04em',
          }}>FRAN<span style={{ color: 'var(--signal)' }}>.</span></div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
            marginTop: 18, background: 'rgba(255,255,255,0.18)',
          }}>
            {[
              { l: 'TYPE', v: 'FOR.TIME' },
              { l: 'ROUNDS', v: '21·15·9' },
              { l: 'CAP', v: '12:00' },
            ].map((d, i) => (
              <div key={i} style={{ background: 'var(--cob)', padding: '12px 10px' }}>
                <div style={{ fontSize: 9, fontWeight: 600, opacity: 0.7, letterSpacing: '0.12em' }}>{d.l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{d.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MOVEMENTS */}
        <div style={{ background: 'var(--bg)', padding: '20px 18px' }}>
          <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.16em', fontWeight: 600, marginBottom: 12 }}>
            ◢ STACK / 02 SEGMENTS
          </div>
          {[
            { n: 'A', name: 'THRUSTERS', s1: '43kg', s2: '30kg', icon: '⊟' },
            { n: 'B', name: 'PULL-UPS', s1: 'STRICT', s2: 'BAND', icon: '⌒' },
          ].map((m, i) => (
            <div key={i} style={{
              border: '1px solid var(--line)',
              padding: '14px',
              marginBottom: 6,
              display: 'grid', gridTemplateColumns: '36px 1fr auto auto',
              gap: 12, alignItems: 'center',
            }}>
              <div style={{
                width: 36, height: 36, background: 'var(--signal)', color: '#000',
                fontWeight: 700, fontSize: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{m.n}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textAlign: 'right' }}>RX<br/><span style={{ color: '#fff' }}>{m.s1}</span></div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textAlign: 'right' }}>SC<br/><span style={{ color: '#fff' }}>{m.s2}</span></div>
            </div>
          ))}
        </div>

        {/* RESERVATION — instrument panel */}
        <div style={{
          background: '#fff', color: '#000',
          padding: '22px 18px',
          margin: '0 0 0 0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.16em' }}>● NEXT.SLOT</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--cob)' }}>T−05:18:00</span>
          </div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontWeight: 700,
            fontSize: 80, marginTop: 10, letterSpacing: '-0.04em', lineHeight: 1,
          }}>12<span style={{ color: 'var(--cob)' }}>:</span>00</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, fontWeight: 600 }}>
            <span>COACH / ANDRÉS.L</span>
            <span>OCC / 8.OF.14</span>
          </div>
          {/* capacity bar */}
          <div style={{ marginTop: 10, height: 6, background: '#e6e6e6', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, width: '57%', background: 'var(--cob)' }}/>
          </div>

          <button style={{
            width: '100%', marginTop: 18, padding: 18,
            background: '#000', color: 'var(--signal)',
            border: 'none', cursor: 'pointer',
            fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 14,
            letterSpacing: '0.12em', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>► START.SESSION</span>
            <span>{'»'}</span>
          </button>
        </div>

        {/* WEEK */}
        <div style={{ padding: '20px 18px', borderTop: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, letterSpacing: '0.16em', color: 'var(--ink-mute)' }}>
            <span>◢ WEEK / W18</span>
            <span style={{ color: 'var(--signal)' }}>3.OF.5</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 12 }}>
            {['L','M','M','J','V','S','D'].map((d, i) => {
              const done = [0,2,3].includes(i);
              const today = i === 4;
              return (
                <div key={i} style={{
                  height: 60,
                  background: done ? 'var(--cob)' : (today ? 'var(--signal)' : 'transparent'),
                  border: done || today ? 'none' : '1px solid var(--line)',
                  position: 'relative',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', padding: 6,
                }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: today ? '#000' : (done ? '#fff' : 'var(--ink-mute)') }}>{d}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: today ? '#000' : (done ? '#fff' : 'var(--ink-mute)') }}>
                    {done ? '✓' : (today ? 'NOW' : '—')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PR DATA */}
        <div style={{ padding: '20px 18px', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.16em', fontWeight: 600, marginBottom: 14 }}>
            ◢ RECENT.RECORDS
          </div>
          {[
            { mov: 'BACK.SQUAT', val: '142.5', u: 'kg', d: '+5.0', date: '18·APR' },
            { mov: 'FRAN', val: '06:42', u: '', d: '−0:36', date: '12·NOV' },
            { mov: 'CLEAN.JERK', val: '95.0', u: 'kg', d: '+2.5', date: '02·MAR' },
          ].map((p, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr auto auto',
              gap: 14, alignItems: 'baseline',
              padding: '10px 0',
              borderTop: '1px solid var(--line)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.mov}</div>
                <div style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.1em', marginTop: 2 }}>{p.date}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--signal)' }}>{p.d}</div>
              <div style={{ fontSize: 22, fontWeight: 700, minWidth: 90, textAlign: 'right' }}>
                {p.val}<span style={{ fontSize: 11, color: 'var(--ink-mute)', marginLeft: 4 }}>{p.u}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: 80 }}/>
      </div>
    </div>
  );
}

function CobaltoWod() {
  return (
    <div className="dir-cobalto phone">
      <div className="island"></div>
      <div className="status">
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 600 }}>06:42</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 500 }}>•••••</span>
      </div>
      <div className="home-ind"></div>

      <div className="scroll">
        {/* top bar */}
        <div style={{
          padding: '60px 18px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--line)',
        }}>
          <button style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 11, letterSpacing: '0.12em', fontWeight: 600, fontFamily: 'IBM Plex Mono' }}>
            ◀ BACK
          </button>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600 }}>WOD.000218 / 02·MAY</span>
        </div>

        {/* MASSIVE HEADER */}
        <div style={{ background: 'var(--cob)', padding: '24px 18px 28px' }}>
          <div style={{ fontSize: 11, color: 'var(--signal)', fontWeight: 700, letterSpacing: '0.18em' }}>
            BENCHMARK · THE.GIRLS
          </div>
          <div style={{
            fontFamily: 'IBM Plex Mono', fontWeight: 700,
            fontSize: 168, lineHeight: 0.86, marginTop: 18,
            letterSpacing: '-0.05em',
          }}>FRAN<span style={{ color: 'var(--signal)' }}>.</span></div>
        </div>

        {/* KPI strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
          background: 'var(--line)',
        }}>
          {[
            { l: 'TYPE', v: 'FOR.TIME' },
            { l: 'SCHEME', v: '21·15·9' },
            { l: 'TIME.CAP', v: '12:00' },
          ].map((d, i) => (
            <div key={i} style={{ background: 'var(--bg)', padding: '14px 12px' }}>
              <div style={{ fontSize: 9, color: 'var(--ink-mute)', letterSpacing: '0.14em', fontWeight: 600 }}>{d.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{d.v}</div>
            </div>
          ))}
        </div>

        {/* MOVEMENTS */}
        <div style={{ background: 'var(--bg)', padding: '24px 18px' }}>
          {[
            { n: '01', name: 'THRUSTERS', spec: '43 / 30 KG', hint: 'FRONT.RACK → OVERHEAD' },
            { n: '02', name: 'PULL-UPS', spec: 'STRICT · BAND', hint: 'CHIN.OVER.BAR' },
          ].map((m, i) => (
            <div key={i} style={{
              padding: '20px 0',
              borderBottom: '1px solid var(--line)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: 'var(--signal)', fontWeight: 700, letterSpacing: '0.14em' }}>
                  STEP.{m.n}
                </span>
                <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 600 }}>{m.spec}</span>
              </div>
              <div style={{
                fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em',
                marginTop: 6,
              }}>{m.name}</div>
              <div style={{ fontSize: 10, color: 'var(--ink-mute)', letterSpacing: '0.16em', fontWeight: 500, marginTop: 4 }}>
                {m.hint}
              </div>
            </div>
          ))}
        </div>

        {/* PR card */}
        <div style={{ background: 'var(--signal)', color: '#000', padding: '22px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em' }}>
            ★ PERSONAL.BEST
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14 }}>
            <div style={{
              fontFamily: 'IBM Plex Mono', fontWeight: 700,
              fontSize: 86, lineHeight: 0.9,
            }}>06:42</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>RX · 12·NOV·25</div>
              <div style={{ fontSize: 10, marginTop: 4, letterSpacing: '0.1em', fontWeight: 600 }}>3 ATTEMPTS LOGGED</div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            {[
              { t: '06:42', d: '12·NOV', rx: 'RX' },
              { t: '07:18', d: '08·APR', rx: 'RX' },
              { t: '08:04', d: '14·OCT', rx: 'SC' },
            ].map((h, i) => (
              <div key={i} style={{
                background: i === 0 ? 'var(--cob)' : 'transparent',
                color: i === 0 ? '#fff' : '#000',
                border: i === 0 ? 'none' : '1px solid #000',
                padding: '10px 8px',
              }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 18 }}>{h.t}</div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', marginTop: 4 }}>
                  {h.d} / {h.rx}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ background: 'var(--bg)', padding: '22px 18px 40px' }}>
          <button style={{
            width: '100%', padding: 22,
            background: 'var(--signal)', color: '#000',
            border: 'none', cursor: 'pointer',
            fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 16,
            letterSpacing: '0.12em',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>► START.TIMER</span>
            <span style={{ fontSize: 18 }}>»</span>
          </button>
          <button style={{
            width: '100%', padding: 18, marginTop: 8,
            background: 'transparent', color: '#fff',
            border: '1px solid var(--line)', cursor: 'pointer',
            fontFamily: 'IBM Plex Mono', fontWeight: 600, fontSize: 12,
            letterSpacing: '0.16em',
          }}>LOG.MANUAL.SCORE</button>
        </div>
      </div>
    </div>
  );
}

window.CobaltoHome = CobaltoHome;
window.CobaltoWod = CobaltoWod;
