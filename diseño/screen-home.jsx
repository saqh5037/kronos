// Kronos — Home (Hoy)

function HomeScreen({ onNav, onStartWod, hasReservation }) {
  return (
    <div className="screen-scroll" style={{ position: 'relative' }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 22px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KGlyph size={18} stroke={1.4}/>
          <span style={{
            fontFamily: 'var(--display)', fontSize: 17, fontWeight: 500,
            letterSpacing: '0.36em', color: 'var(--marble)',
          }}>KRONOS</span>
        </div>
        <button style={{
          background: 'transparent', border: 'none', color: 'var(--marble-mute)',
          padding: 6, cursor: 'pointer', position: 'relative',
        }}>
          {Icon.bell(20)}
          <span style={{
            position: 'absolute', top: 5, right: 5, width: 6, height: 6,
            borderRadius: 3, background: 'var(--bronze)',
          }}/>
        </button>
      </div>

      {/* Greeting */}
      <div style={{ padding: '24px 22px 6px' }}>
        <div className="eyebrow">Vie · 02 may · 06:42</div>
        <div className="display" style={{ fontSize: 38, marginTop: 14, color: 'var(--marble)' }}>
          Buenos días,<br/>
          <span style={{ fontStyle: 'italic', color: 'var(--bronze)' }}>Diego.</span>
        </div>
      </div>

      {/* —— WOD HERO (editorial) —— */}
      <div style={{
        margin: '32px 16px 0',
        background: '#0d0c0a',
        border: '0.5px solid var(--line)',
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* hero strip — placeholder image */}
        <div className="placeholder-img" style={{
          height: 156, position: 'relative',
          borderTopLeftRadius: 16, borderTopRightRadius: 16,
        }}>
          {/* duotone bronze on top */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(184,153,104,0.08) 0%, rgba(10,10,10,0.92) 100%)',
          }}/>
          {/* tape */}
          <div style={{
            position: 'absolute', top: 14, left: 16, display: 'flex',
            alignItems: 'center', gap: 10,
          }}>
            <div className="live-dot"/>
            <span className="eyebrow eyebrow-bronze">WOD del día</span>
          </div>
          {/* big benchmark mark */}
          <div style={{
            position: 'absolute', bottom: 18, left: 16, right: 16,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 2 }}>Benchmark · The Girls</div>
              <div className="display" style={{
                fontSize: 64, color: 'var(--marble)', fontStyle: 'italic',
                fontWeight: 500, lineHeight: 0.92,
              }}>Fran</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="eyebrow" style={{ marginBottom: 2 }}>For Time</div>
              <div className="mono" style={{ color: 'var(--bronze)', fontSize: 13, letterSpacing: '0.06em' }}>21·15·9</div>
            </div>
          </div>
        </div>

        {/* movements */}
        <div style={{ padding: '20px 18px 6px' }}>
          {WOD_TODAY.movements.map((m, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '24px 1fr auto',
              alignItems: 'baseline', gap: 12,
              padding: '10px 0',
              borderBottom: i < WOD_TODAY.movements.length - 1 ? '0.5px solid var(--line)' : 'none',
            }}>
              <div className="mono" style={{
                fontSize: 11, color: 'var(--marble-faint)', letterSpacing: '0.08em',
              }}>0{i + 1}</div>
              <div>
                <div style={{
                  fontFamily: 'var(--display)', fontSize: 22, fontWeight: 500,
                  color: 'var(--marble)', letterSpacing: '-0.005em',
                }}>{m.name}</div>
                <div className="caption" style={{ marginTop: 2, fontSize: 11.5 }}>{m.subtitle}</div>
              </div>
              <div className="mono" style={{
                fontSize: 12, color: 'var(--bronze)', letterSpacing: '0.04em', whiteSpace: 'nowrap',
              }}>{m.spec}</div>
            </div>
          ))}
        </div>

        {/* coach note */}
        <div style={{
          padding: '12px 18px 18px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 13,
            background: 'linear-gradient(135deg, #2a241c, #1a1612)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--display)', fontSize: 11, color: 'var(--bronze-2)',
            fontWeight: 600, flexShrink: 0,
          }}>RP</div>
          <div className="caption" style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--marble-mute)' }}>
            "{WOD_TODAY.notes}"
            <span style={{ color: 'var(--marble-faint)', fontStyle: 'normal', marginLeft: 6 }}>— Renata, coach</span>
          </div>
        </div>
      </div>

      {/* —— PRÓXIMA CLASE —— */}
      <div style={{ margin: '28px 16px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '0 4px 10px',
        }}>
          <span className="eyebrow">Próxima clase</span>
          <span className="num-tag">en 5 h 18 m</span>
        </div>
        <div className="card" style={{ padding: 18 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          }}>
            <div>
              <div className="mono" style={{
                fontSize: 11, color: 'var(--bronze)', letterSpacing: '0.08em',
              }}>VIE · 02 MAY</div>
              <div className="display" style={{
                fontSize: 44, color: 'var(--marble)', marginTop: 4,
              }}>
                12<span style={{ color: 'var(--marble-faint)' }}>:</span>00
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="eyebrow">Cupo</div>
              <div className="mono" style={{ fontSize: 14, color: 'var(--marble)', marginTop: 2 }}>
                <span style={{ color: 'var(--bronze)' }}>8</span><span style={{ color: 'var(--marble-faint)' }}>/14</span>
              </div>
            </div>
          </div>
          <div style={{ height: 14 }}/>
          <div className="section-rule"/>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            paddingTop: 12,
          }}>
            <div className="caption" style={{ display: 'flex', gap: 14, fontSize: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {Icon.users(13)} Andrés L.
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {Icon.pin(13)} Box
              </span>
            </div>
            <button className="btn-quiet" style={{ fontSize: 11 }} onClick={() => onNav('calendar')}>
              Cambiar
            </button>
          </div>
        </div>

        {/* CTA */}
        <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={onStartWod}>
          {Icon.play(11, '#0a0a0a')} Iniciar entreno
        </button>
      </div>

      {/* —— ESTA SEMANA —— */}
      <div style={{ margin: '36px 22px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          marginBottom: 14,
        }}>
          <span className="eyebrow">Esta semana</span>
          <span className="num-tag">3 / 5 sesiones</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['L','M','M','J','V','S','D'].map((d, i) => {
            const done = i < 4 && i !== 1;
            const today = i === 4;
            return (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div className="mono" style={{
                  fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.12em',
                  marginBottom: 6,
                }}>{d}</div>
                <div style={{
                  height: 36, borderRadius: 6,
                  background: done ? 'var(--bronze)' : (today ? 'transparent' : 'var(--carbon-2)'),
                  border: today ? '1px dashed var(--bronze)' : '0.5px solid var(--line)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}>
                  {done && Icon.check(13, '#0a0a0a')}
                  {today && (
                    <div className="mono" style={{
                      fontSize: 9, color: 'var(--bronze)', letterSpacing: '0.06em',
                    }}>HOY</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* —— LECTURA RÁPIDA —— */}
      <div style={{ margin: '36px 16px 0' }}>
        <div className="eyebrow" style={{ padding: '0 6px 12px' }}>Lectura rápida</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatTile
            eyebrow="PR Back Squat"
            value="142.5"
            unit="kg"
            delta="+5.0 kg"
            footer="Hace 14 días"
            onClick={() => onNav('profile')}
          />
          <StatTile
            eyebrow="Fran · best"
            value="6:42"
            delta="−0:36"
            footer="6 meses atrás"
            mono
          />
          <StatTile
            eyebrow="Asistencia · 30d"
            value="22"
            unit="/30"
            delta="73%"
            footer="Sobre tu media: +9%"
          />
          <StatTile
            eyebrow="Próximo cobro"
            value="$1,650"
            unit="MXN"
            delta="en 12 días"
            footer="Plan Ilimitado"
            onClick={() => onNav('pay')}
          />
        </div>
      </div>

      <div style={{ height: 30 }}/>
    </div>
  );
}

function StatTile({ eyebrow, value, unit, delta, footer, mono, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--carbon-2)',
      border: '0.5px solid var(--line)',
      borderRadius: 12,
      padding: '14px 14px 12px',
      textAlign: 'left',
      cursor: onClick ? 'pointer' : 'default',
      color: 'inherit',
      fontFamily: 'var(--ui)',
    }}>
      <div className="eyebrow" style={{ fontSize: 9 }}>{eyebrow}</div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span className={mono ? 'mono' : 'display'} style={{
          fontSize: mono ? 24 : 28,
          fontWeight: 500,
          color: 'var(--marble)',
          letterSpacing: mono ? '0.01em' : '-0.01em',
          lineHeight: 1,
        }}>{value}</span>
        {unit && <span className="mono" style={{
          fontSize: 11, color: 'var(--marble-faint)',
        }}>{unit}</span>}
      </div>
      <div style={{
        marginTop: 6, display: 'flex', justifyContent: 'space-between',
        alignItems: 'baseline',
      }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--bronze)' }}>{delta}</span>
        <span className="caption" style={{ fontSize: 10, color: 'var(--marble-faint)' }}>{footer}</span>
      </div>
    </button>
  );
}

Object.assign(window, { HomeScreen });
