// Kronos — Calendario y reserva

function CalendarScreen({ onReserve, reservedIds, waitlistIds }) {
  const [selectedDay, setSelectedDay] = React.useState(0);
  const [openClass, setOpenClass] = React.useState(null);
  const classesForDay = SCHEDULE.filter(c => c.day === selectedDay);

  return (
    <>
      <div className="screen-scroll">
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 22px 0',
        }}>
          <span className="eyebrow">Reservar · Mayo 2026</span>
          <button style={{
            background: 'transparent', border: 'none', color: 'var(--marble-mute)',
            padding: 6, cursor: 'pointer',
          }}>{Icon.sliders(18)}</button>
        </div>

        {/* Title */}
        <div style={{ padding: '14px 22px 18px' }}>
          <div className="display" style={{ fontSize: 38, color: 'var(--marble)' }}>
            Esta <span style={{ fontStyle: 'italic', color: 'var(--bronze)' }}>semana</span>
          </div>
        </div>

        {/* Day picker */}
        <div style={{
          display: 'flex', gap: 8, padding: '0 16px', overflowX: 'auto',
        }} className="no-scrollbar">
          {DAYS.map((d, i) => {
            const active = i === selectedDay;
            return (
              <button key={i} onClick={() => setSelectedDay(i)} style={{
                minWidth: 56, padding: '12px 0', borderRadius: 10,
                background: active ? 'var(--marble)' : 'var(--carbon-2)',
                color: active ? 'var(--obsidian)' : 'var(--marble)',
                border: '0.5px solid ' + (active ? 'var(--marble)' : 'var(--line)'),
                cursor: 'pointer', textAlign: 'center',
                fontFamily: 'var(--ui)',
                transition: 'all 100ms linear',
              }}>
                <div className="mono" style={{
                  fontSize: 9, letterSpacing: '0.12em',
                  color: active ? 'var(--obsidian)' : 'var(--marble-faint)',
                }}>{d.label}</div>
                <div className="display" style={{
                  fontSize: 24, fontWeight: 500, marginTop: 2, lineHeight: 1,
                }}>{d.date}</div>
              </button>
            );
          })}
        </div>

        {/* Day header */}
        <div style={{ padding: '24px 22px 8px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span className="display" style={{
            fontSize: 22, color: 'var(--marble)', fontStyle: 'italic',
          }}>{DAYS[selectedDay].full}</span>
          <span className="num-tag">{classesForDay.length} clases</span>
        </div>

        {/* Class list */}
        <div style={{ padding: '4px 16px' }}>
          {classesForDay.map((c) => {
            const full = c.taken >= c.spots;
            const reserved = reservedIds.includes(c.id);
            const onWaitlist = waitlistIds.includes(c.id);
            return (
              <button key={c.id} onClick={() => setOpenClass(c)} style={{
                width: '100%',
                background: reserved ? '#15110a' : 'var(--carbon-2)',
                border: '0.5px solid ' + (reserved ? 'var(--bronze)' : 'var(--line)'),
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 8,
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--marble)',
                fontFamily: 'var(--ui)',
                display: 'grid',
                gridTemplateColumns: '64px 1fr auto',
                gap: 16,
                alignItems: 'center',
              }}>
                <div>
                  <div className="display" style={{ fontSize: 26, lineHeight: 1, color: 'var(--marble)' }}>
                    {c.time}
                  </div>
                  <div className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', marginTop: 4, letterSpacing: '0.08em' }}>
                    {c.kind.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--marble)' }}>
                    {c.wod}
                  </div>
                  <div className="caption" style={{ fontSize: 11, marginTop: 2 }}>
                    {c.coach}
                  </div>
                  {/* capacity bar */}
                  <div style={{
                    marginTop: 8, height: 2, background: 'var(--line)', borderRadius: 1,
                    position: 'relative', width: 110,
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${(c.taken / c.spots) * 100}%`,
                      background: full ? 'var(--marble-mute)' : 'var(--bronze)',
                      borderRadius: 1,
                    }}/>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {reserved ? (
                    <div className="mono" style={{
                      fontSize: 10, color: 'var(--bronze)', letterSpacing: '0.1em',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>{Icon.check(11, 'currentColor')} RESERVADA</div>
                  ) : onWaitlist ? (
                    <div className="mono" style={{
                      fontSize: 10, color: 'var(--marble-mute)', letterSpacing: '0.1em',
                    }}>EN ESPERA</div>
                  ) : (
                    <div>
                      <div className="mono" style={{ fontSize: 13, color: 'var(--marble)' }}>
                        {c.spots - c.taken}
                      </div>
                      <div className="mono" style={{ fontSize: 9, color: 'var(--marble-faint)', letterSpacing: '0.1em' }}>
                        LIBRES
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ height: 20 }}/>
      </div>

      {openClass && (
        <ClassSheet
          klass={openClass}
          onClose={() => setOpenClass(null)}
          onReserve={() => {
            onReserve(openClass);
            setOpenClass(null);
          }}
          reserved={reservedIds.includes(openClass.id)}
          onWaitlist={waitlistIds.includes(openClass.id)}
        />
      )}
    </>
  );
}

function ClassSheet({ klass, onClose, onReserve, reserved, onWaitlist }) {
  const full = klass.taken >= klass.spots;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end',
      animation: 'fade-up 220ms linear',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        background: '#0d0c0a',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTop: '0.5px solid var(--line-strong)',
        padding: '14px 22px 36px',
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--line-strong)',
          margin: '0 auto 18px',
        }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div className="eyebrow">{klass.kind} · Andrés L.</div>
          <div className="num-tag">{klass.taken}/{klass.spots}</div>
        </div>
        <div className="display" style={{
          fontSize: 56, color: 'var(--marble)', marginTop: 6, lineHeight: 1,
        }}>{klass.time}</div>
        <div style={{ marginTop: 6, fontFamily: 'var(--display)', fontSize: 24,
          fontStyle: 'italic', color: 'var(--bronze)' }}>{klass.wod}</div>

        {klass.wod === 'Fran' && (
          <div className="mono" style={{
            marginTop: 18, fontSize: 12, color: 'var(--marble-mute)',
            letterSpacing: '0.04em', lineHeight: 1.7,
          }}>
            21·15·9 FOR TIME<br/>
            THRUSTERS · 43 / 30 KG<br/>
            PULL-UPS
          </div>
        )}

        {/* roster preview */}
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex' }}>
            {ATHLETES.slice(1, 6).map((a, i) => (
              <div key={a.id} className="avatar" style={{
                width: 26, height: 26, fontSize: 10,
                marginLeft: i === 0 ? 0 : -8,
                border: '1.5px solid #0d0c0a',
                background: 'linear-gradient(135deg, #2a241c, #14110e)',
              }}>{a.initials}</div>
            ))}
          </div>
          <span className="caption" style={{ fontSize: 11 }}>
            {klass.taken} reservados — {klass.spots - klass.taken > 0 ? `${klass.spots - klass.taken} libres` : 'lista de espera'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Cerrar
          </button>
          {reserved ? (
            <button className="btn btn-ghost" style={{ flex: 1.2, color: 'var(--error)', borderColor: 'rgba(181, 86, 74, 0.4)' }} onClick={onReserve}>
              Cancelar
            </button>
          ) : onWaitlist ? (
            <button className="btn btn-ghost" style={{ flex: 1.2 }} disabled>
              En espera
            </button>
          ) : (
            <button className="btn btn-primary" style={{ flex: 1.4 }} onClick={onReserve}>
              {full ? 'Lista de espera' : 'Reservar'}
            </button>
          )}
        </div>

        {!reserved && !full && (
          <div className="caption" style={{ fontSize: 10.5, marginTop: 12, textAlign: 'center', color: 'var(--marble-faint)' }}>
            Cancelación libre hasta 4 h antes
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CalendarScreen });
