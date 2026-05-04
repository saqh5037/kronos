// Kronos — Profile + PRs + progression chart

function ProfileScreen({ onNav }) {
  const [filter, setFilter] = React.useState('Todo');
  const cats = ['Todo', 'Olímpico', 'Levantamiento', 'Benchmark', 'Hero'];
  const filtered = filter === 'Todo' ? PRS : PRS.filter(p => p.cat === filter);

  return (
    <div className="screen-scroll">
      {/* Top bar */}
      <div style={{ padding: '8px 22px 0', display: 'flex', justifyContent: 'space-between' }}>
        <span className="eyebrow">Atleta</span>
        <button style={{ background: 'transparent', border: 'none', color: 'var(--marble-mute)', cursor: 'pointer', padding: 6 }}>
          {Icon.more(18)}
        </button>
      </div>

      {/* Athlete header */}
      <div style={{ padding: '20px 22px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="avatar" style={{
          width: 64, height: 64, fontSize: 22,
          background: 'linear-gradient(135deg, #2a241c, #14110e)',
          border: '0.5px solid var(--line-strong)',
        }}>DV</div>
        <div style={{ flex: 1 }}>
          <div className="display" style={{ fontSize: 28, color: 'var(--marble)', lineHeight: 1.1 }}>
            Diego <span style={{ fontStyle: 'italic' }}>Velázquez</span>
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--marble-faint)', letterSpacing: '0.1em', marginTop: 6 }}>
            ATLETA · 27 AÑOS · DESDE MAR 2024
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ padding: '24px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--line)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { l: 'Sesiones', v: '218', s: 'totales' },
            { l: 'Asistencia', v: '73', s: '% · 30d' },
            { l: 'PRs activos', v: '14', s: 'movimientos' },
          ].map((k, i) => (
            <div key={i} style={{ background: 'var(--carbon-2)', padding: '14px 12px' }}>
              <div className="eyebrow" style={{ fontSize: 9 }}>{k.l}</div>
              <div className="display" style={{ fontSize: 28, color: 'var(--marble)', marginTop: 6, lineHeight: 1 }}>{k.v}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', marginTop: 4, letterSpacing: '0.08em' }}>{k.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hero PR — Back Squat with timeline */}
      <div style={{ padding: '32px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 6px 12px' }}>
          <span className="eyebrow eyebrow-bronze">Récord en alza</span>
          <span className="num-tag">+32.5 kg en 24 meses</span>
        </div>
        <div className="card" style={{ padding: '18px 18px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: 'var(--marble)', fontStyle: 'italic' }}>Back Squat</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--marble-faint)', letterSpacing: '0.1em', marginTop: 4 }}>
                LEVANTAMIENTO · 18 ABR 2026
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 36, color: 'var(--bronze)', fontWeight: 300, lineHeight: 1 }}>142.5</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--marble-faint)', letterSpacing: '0.06em' }}>KG</div>
            </div>
          </div>
          {/* chart */}
          <PRChart data={PR_TIMELINE}/>
        </div>
      </div>

      {/* PR list */}
      <div style={{ padding: '36px 22px 0' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Marcas personales</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }} className="no-scrollbar">
          {cats.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding: '6px 12px', borderRadius: 100,
              background: filter === c ? 'var(--marble)' : 'transparent',
              color: filter === c ? 'var(--obsidian)' : 'var(--marble-mute)',
              border: '0.5px solid ' + (filter === c ? 'var(--marble)' : 'var(--line-strong)'),
              fontFamily: 'var(--ui)', fontSize: 11, fontWeight: 500,
              letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {filtered.map((pr, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: 14, alignItems: 'baseline',
            padding: '14px 8px',
            borderTop: i === 0 ? '0.5px solid var(--line)' : 'none',
            borderBottom: '0.5px solid var(--line)',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: 'var(--marble)' }}>{pr.mov}</div>
              <div className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.08em', marginTop: 2 }}>
                {pr.cat.toUpperCase()} · {pr.date}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 11, color: pr.neg ? 'var(--success)' : 'var(--bronze)' }}>
              {pr.delta}
            </div>
            <div className="mono" style={{ fontSize: 22, color: 'var(--marble)', minWidth: 60, textAlign: 'right', fontWeight: 400 }}>
              {pr.value}<span style={{ fontSize: 11, color: 'var(--marble-faint)', marginLeft: 4 }}>{pr.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance heatmap */}
      <div style={{ padding: '32px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <span className="eyebrow">Asistencia · 30 días</span>
          <span className="num-tag">22 / 30</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gap: 4 }}>
          {ATTENDANCE_30.map((v, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              background: v ? 'var(--bronze)' : 'var(--carbon)',
              opacity: v ? (0.55 + (i / 60)) : 0.5,
              borderRadius: 2,
            }}/>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.1em' }}>04 ABR</span>
          <span className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.1em' }}>HOY</span>
        </div>
      </div>

      <div style={{ height: 30 }}/>
    </div>
  );
}

function PRChart({ data }) {
  const w = 320, h = 110, pad = 4;
  const max = Math.max(...data.map(d => d.v));
  const min = Math.min(...data.map(d => d.v));
  const range = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * (w - pad * 2) + pad);
  const ys = data.map(d => h - pad - ((d.v - min) / range) * (h - pad * 2));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fillPath = path + ` L${w - pad},${h - pad} L${pad},${h - pad} Z`;
  return (
    <div style={{ marginTop: 16 }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="prFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B89968" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#B89968" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* grid lines */}
        {[0.25, 0.5, 0.75].map(t => (
          <line key={t} x1={pad} x2={w - pad} y1={h * t} y2={h * t} stroke="rgba(244,241,234,0.06)" strokeWidth="0.5"/>
        ))}
        <path d={fillPath} fill="url(#prFill)"/>
        <path d={path} fill="none" stroke="#B89968" strokeWidth="1.4" strokeLinejoin="round"/>
        {xs.map((x, i) => (
          <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 3 : 1.5}
                  fill={i === xs.length - 1 ? '#F4F1EA' : '#B89968'}/>
        ))}
        {/* last point label */}
        <text x={xs[xs.length - 1] - 6} y={ys[ys.length - 1] - 8}
              textAnchor="end" fontFamily="JetBrains Mono" fontSize="9" fill="#F4F1EA" letterSpacing="0.04em">
          142.5 KG
        </text>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        <span className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.08em' }}>{data[0].d}</span>
        <span className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.08em' }}>{data[data.length - 1].d}</span>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileScreen });
