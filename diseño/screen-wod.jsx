// Kronos — WOD detail + post-WOD logging

function WodScreen({ onBack, onLogScore }) {
  const [stage, setStage] = React.useState('pre'); // pre | timer | log | done
  const [seconds, setSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [score, setScore] = React.useState({ minutes: 6, seconds: 24, level: 'rx', notes: '' });

  React.useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const fmt = (s) => {
    const m = Math.floor(s / 60); const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  };

  if (stage === 'pre') {
    return (
      <div className="screen-scroll">
        <div style={{ padding: '8px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn-quiet" onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {Icon.chevronL(12)} Volver
          </button>
          <span className="eyebrow">02 MAY · 12:00</span>
        </div>

        <div style={{ padding: '22px 22px 0' }}>
          <div className="eyebrow eyebrow-bronze">Benchmark · The Girls</div>
          <div className="display" style={{
            fontSize: 96, color: 'var(--marble)', fontStyle: 'italic',
            marginTop: 6, lineHeight: 0.92,
          }}>Fran</div>
          <div className="mono" style={{
            fontSize: 13, color: 'var(--bronze)', letterSpacing: '0.16em', marginTop: 14,
          }}>FOR TIME · 21 · 15 · 9</div>
        </div>

        {/* movements */}
        <div style={{ padding: '32px 22px 0' }}>
          {WOD_TODAY.movements.map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '32px 1fr',
              gap: 14, padding: '16px 0',
              borderTop: '0.5px solid var(--line)',
              borderBottom: i === WOD_TODAY.movements.length - 1 ? '0.5px solid var(--line)' : 'none',
            }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--marble-faint)', letterSpacing: '0.1em', paddingTop: 6 }}>
                0{i + 1}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 30, color: 'var(--marble)', lineHeight: 1 }}>
                  {m.name}
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--bronze)', marginTop: 8, letterSpacing: '0.04em' }}>
                  {m.spec}
                </div>
                <div className="caption" style={{ fontSize: 12, marginTop: 6 }}>{m.subtitle}</div>
              </div>
            </div>
          ))}
        </div>

        {/* personal best */}
        <div style={{ padding: '24px 16px 0' }}>
          <div className="card" style={{ padding: '16px 18px' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Tu mejor marca</div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="mono" style={{
                fontSize: 36, color: 'var(--marble)', letterSpacing: '0.02em', fontWeight: 500,
              }}>6:42</div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--bronze)' }}>RX · 12 NOV 2025</div>
                <div className="caption" style={{ fontSize: 11, marginTop: 2 }}>3 intentos previos</div>
              </div>
            </div>
            <div style={{ height: 10 }}/>
            <div className="section-rule"/>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {WOD_TODAY.history.map((h, i) => (
                <div key={i}>
                  <div className="mono" style={{ fontSize: 16, color: i === 0 ? 'var(--bronze)' : 'var(--marble)' }}>{h.time}</div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.08em', marginTop: 2 }}>
                    {h.date} · {h.rx ? 'RX' : 'SC'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '24px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Notas del coach</div>
          <div className="caption" style={{ fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>
            "{WOD_TODAY.notes}"
          </div>
        </div>

        <div style={{ padding: '32px 16px 0' }}>
          <button className="btn btn-primary btn-block" onClick={() => { setStage('timer'); setRunning(true); }}>
            {Icon.play(11, '#0a0a0a')} Comenzar cronómetro
          </button>
          <button className="btn btn-ghost btn-block" style={{ marginTop: 10 }} onClick={() => setStage('log')}>
            Registrar marca manual
          </button>
        </div>

        <div style={{ height: 32 }}/>
      </div>
    );
  }

  if (stage === 'timer') {
    return (
      <div style={{ position: 'absolute', inset: 0, background: 'var(--obsidian)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '60px 22px 0', display: 'flex', justifyContent: 'space-between' }}>
          <span className="eyebrow eyebrow-bronze">FRAN · FOR TIME</span>
          <span className="eyebrow"><span className="live-dot" style={{ display: 'inline-block', marginRight: 6 }}/>EN VIVO</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mono" style={{
            fontSize: 124, fontWeight: 300, color: 'var(--marble)',
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>{fmt(seconds)}</div>
          <div className="eyebrow" style={{ marginTop: 14 }}>Round {seconds < 30 ? '01' : seconds < 60 ? '02' : '03'} de 03</div>

          <div style={{ marginTop: 56, width: '80%' }}>
            {[
              { reps: 21, label: 'Thrusters' },
              { reps: 15, label: 'Pull-ups' },
              { reps: 9, label: 'Round 02' },
            ].map((step, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                padding: '12px 0', borderBottom: '0.5px solid var(--line)',
                opacity: i === 0 ? 1 : 0.45,
              }}>
                <span style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--marble)' }}>
                  {step.label}
                </span>
                <span className="mono" style={{ fontSize: 16, color: i === 0 ? 'var(--bronze)' : 'var(--marble-mute)' }}>
                  {step.reps} reps
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '0 16px 50px', display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setRunning(r => !r)}>
            {running ? 'Pausar' : 'Continuar'}
          </button>
          <button className="btn btn-primary" style={{ flex: 1.4 }} onClick={() => { setRunning(false); setScore(s => ({ ...s, minutes: Math.floor(seconds / 60) || 6, seconds: seconds % 60 || 24 })); setStage('log'); }}>
            Terminar
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'log') {
    return (
      <div className="screen-scroll">
        <div style={{ padding: '8px 22px 0', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn-quiet" onClick={() => setStage('pre')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {Icon.chevronL(12)} Cancelar
          </button>
          <span className="eyebrow">Registrar · Fran</span>
        </div>

        <div style={{ padding: '24px 22px 0' }}>
          <div className="eyebrow">Tu tiempo</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
            <NumberSpinner value={score.minutes} onChange={v => setScore({ ...score, minutes: v })} max={59}/>
            <span className="display" style={{ fontSize: 64, color: 'var(--marble-faint)' }}>:</span>
            <NumberSpinner value={score.seconds} onChange={v => setScore({ ...score, seconds: v })} max={59}/>
            <span className="mono" style={{ fontSize: 12, color: 'var(--marble-faint)', marginLeft: 10, letterSpacing: '0.1em' }}>MIN · SEG</span>
          </div>
        </div>

        <div style={{ padding: '28px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Nivel</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'sc', label: 'Scaled', sub: 'Banda / 30 kg' },
              { id: 'rx', label: 'RX', sub: '43 kg · strict' },
              { id: 'rx+', label: 'RX+', sub: 'C2B · 52 kg' },
            ].map(l => (
              <button key={l.id} onClick={() => setScore({ ...score, level: l.id })} style={{
                flex: 1, padding: '14px 8px',
                background: score.level === l.id ? 'var(--marble)' : 'var(--carbon-2)',
                color: score.level === l.id ? 'var(--obsidian)' : 'var(--marble)',
                border: '0.5px solid ' + (score.level === l.id ? 'var(--marble)' : 'var(--line)'),
                borderRadius: 10, cursor: 'pointer', fontFamily: 'var(--ui)',
              }}>
                <div className="display" style={{ fontSize: 18 }}>{l.label}</div>
                <div className="mono" style={{ fontSize: 9, opacity: 0.65, marginTop: 2, letterSpacing: '0.08em' }}>{l.sub}</div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '28px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Notas</div>
          <textarea
            value={score.notes}
            onChange={e => setScore({ ...score, notes: e.target.value })}
            placeholder="Sensaciones, peso real, cómo dividiste series…"
            style={{
              width: '100%', minHeight: 78, background: 'var(--carbon-2)',
              border: '0.5px solid var(--line)', borderRadius: 10,
              padding: 14, fontFamily: 'var(--ui)', fontSize: 13,
              color: 'var(--marble)', resize: 'none', outline: 'none',
            }}
          />
        </div>

        <div style={{ padding: '24px 22px 0' }}>
          <div className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="eyebrow">Comparativa</div>
              <div className="caption" style={{ fontSize: 12, marginTop: 4 }}>
                {(() => {
                  const total = score.minutes * 60 + score.seconds;
                  const pr = 6 * 60 + 42;
                  const diff = total - pr;
                  if (diff < 0) return `Nuevo PR · ${Math.abs(Math.floor(diff / 60))}:${String(Math.abs(diff) % 60).padStart(2, '0')} más rápido`;
                  if (diff === 0) return 'Igualas tu PR';
                  return `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, '0')} sobre tu PR`;
                })()}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 18, color: 'var(--bronze)' }}>
              {String(score.minutes).padStart(2, '0')}:{String(score.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div style={{ padding: '28px 16px 0' }}>
          <button className="btn btn-primary btn-block" onClick={() => { onLogScore(score); setStage('done'); }}>
            Guardar marca
          </button>
        </div>
        <div style={{ height: 32 }}/>
      </div>
    );
  }

  // done
  const total = score.minutes * 60 + score.seconds;
  const pr = 6 * 60 + 42;
  const isNewPR = total < pr;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--obsidian)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '60px 22px 0' }}>
        <div className="eyebrow eyebrow-bronze">{isNewPR ? 'NUEVO RÉCORD PERSONAL' : 'MARCA REGISTRADA'}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 22px' }}>
        <div className="display" style={{ fontSize: 72, color: 'var(--marble)', fontStyle: 'italic' }}>Fran</div>
        <div className="mono" style={{
          fontSize: 96, color: 'var(--bronze)', marginTop: 18,
          letterSpacing: '-0.02em', fontWeight: 300,
        }}>
          {String(score.minutes).padStart(2, '0')}:{String(score.seconds).padStart(2, '0')}
        </div>
        <div className="eyebrow" style={{ marginTop: 18 }}>{score.level.toUpperCase()} · 02 MAY 2026</div>
        {isNewPR && (
          <div className="caption" style={{ marginTop: 32, fontSize: 13, fontStyle: 'italic', textAlign: 'center', maxWidth: 280 }}>
            "Tu marca anterior cayó después de 6 meses. <br/>El tiempo es tu rival."
          </div>
        )}
      </div>
      <div style={{ padding: '0 16px 50px' }}>
        <button className="btn btn-primary btn-block" onClick={onBack}>Listo</button>
      </div>
    </div>
  );
}

function NumberSpinner({ value, onChange, max }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={() => onChange(Math.max(0, value - 1))} style={{
        width: 32, height: 32, borderRadius: 16,
        background: 'var(--carbon-2)', border: '0.5px solid var(--line)',
        color: 'var(--marble)', cursor: 'pointer',
      }}>−</button>
      <span className="mono" style={{
        fontSize: 56, color: 'var(--marble)', fontWeight: 300,
        letterSpacing: '0.01em', minWidth: 76, textAlign: 'center',
      }}>{String(value).padStart(2, '0')}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} style={{
        width: 32, height: 32, borderRadius: 16,
        background: 'var(--carbon-2)', border: '0.5px solid var(--line)',
        color: 'var(--marble)', cursor: 'pointer',
      }}>+</button>
    </div>
  );
}

Object.assign(window, { WodScreen });
