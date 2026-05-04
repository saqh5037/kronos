// Kronos — App root

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "displayFont": "cormorant",
  "showBrandBar": true,
  "showSecondPhone": false
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = React.useState('home');
  const [reservedIds, setReservedIds] = React.useState(['c3']);
  const [waitlistIds, setWaitlistIds] = React.useState([]);
  const [wodOpen, setWodOpen] = React.useState(false);

  const onReserve = (klass) => {
    const full = klass.taken >= klass.spots;
    if (reservedIds.includes(klass.id)) {
      setReservedIds(reservedIds.filter(x => x !== klass.id));
    } else if (full) {
      setWaitlistIds([...waitlistIds, klass.id]);
    } else {
      setReservedIds([...reservedIds, klass.id]);
    }
  };

  const onLogScore = (score) => {
    // no-op for prototype, just close
  };

  return (
    <div data-display-font={tweaks.displayFont}>
      <div className="kronos-stage">
        {tweaks.showBrandBar && (
          <div className="brand-bar">
            <Wordmark size={18}/>
            <span className="meta">Atleta · iOS · v0.4</span>
          </div>
        )}

        <Phone>
          {wodOpen ? (
            <WodScreen onBack={() => setWodOpen(false)} onLogScore={onLogScore}/>
          ) : (
            <>
              {tab === 'home' && (
                <HomeScreen
                  onNav={setTab}
                  onStartWod={() => setWodOpen(true)}
                  hasReservation={reservedIds.length > 0}
                />
              )}
              {tab === 'calendar' && (
                <CalendarScreen
                  onReserve={onReserve}
                  reservedIds={reservedIds}
                  waitlistIds={waitlistIds}
                />
              )}
              {tab === 'wod' && (
                <WodScreen onBack={() => setTab('home')} onLogScore={onLogScore}/>
              )}
              {tab === 'profile' && <ProfileScreen onNav={setTab}/>}
              {tab === 'pay' && <PaymentScreen/>}
              <TabBar active={tab} onChange={(t) => { setTab(t); }}/>
            </>
          )}
        </Phone>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Tipografía display">
          <TweakRadio
            label="Familia"
            value={tweaks.displayFont}
            onChange={v => setTweak('displayFont', v)}
            options={[
              { value: 'cormorant', label: 'Cormorant' },
              { value: 'eb', label: 'EB Garamond' },
              { value: 'fraunces', label: 'Fraunces' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Vista">
          <TweakToggle
            label="Mostrar barra de marca"
            value={tweaks.showBrandBar}
            onChange={v => setTweak('showBrandBar', v)}
          />
        </TweakSection>
        <TweakSection title="Navegar">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {[
              { id: 'home', label: 'Hoy' },
              { id: 'calendar', label: 'Reservar' },
              { id: 'profile', label: 'Atleta' },
              { id: 'pay', label: 'Cuenta' },
            ].map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setWodOpen(false); }} style={{
                padding: '6px 10px', borderRadius: 6,
                background: tab === t.id && !wodOpen ? 'var(--bronze)' : 'transparent',
                color: tab === t.id && !wodOpen ? '#0a0a0a' : 'var(--marble-mute)',
                border: '0.5px solid ' + (tab === t.id && !wodOpen ? 'var(--bronze)' : 'rgba(255,255,255,0.15)'),
                fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em',
              }}>{t.label}</button>
            ))}
            <button onClick={() => setWodOpen(true)} style={{
              padding: '6px 10px', borderRadius: 6,
              background: wodOpen ? 'var(--bronze)' : 'transparent',
              color: wodOpen ? '#0a0a0a' : 'var(--marble-mute)',
              border: '0.5px solid ' + (wodOpen ? 'var(--bronze)' : 'rgba(255,255,255,0.15)'),
              fontSize: 11, cursor: 'pointer', letterSpacing: '0.06em',
            }}>WOD detalle</button>
          </div>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
