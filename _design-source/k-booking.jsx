function KBooking(){
  const days = [
    {d:'LUN',n:12,active:false},
    {d:'MAR',n:13,active:false},
    {d:'MIÉ',n:14,active:true},
    {d:'JUE',n:15,active:false},
    {d:'VIE',n:16,active:false,booked:true},
    {d:'SÁB',n:17,active:false},
    {d:'DOM',n:18,active:false,off:true},
  ];
  const slots = [
    {t:'06:00',c:'Coach Lina',sala:'A',cap:14,cup:16,booked:false,past:true},
    {t:'07:00',c:'Coach Lina',sala:'A',cap:8,cup:16,booked:false,past:true},
    {t:'12:00',c:'Coach Diego',sala:'B',cap:5,cup:12,booked:false,past:true},
    {t:'17:30',c:'Coach Rodrigo',sala:'A',cap:14,cup:16,booked:false},
    {t:'18:30',c:'Coach Rodrigo',sala:'A',cap:12,cup:16,booked:true},
    {t:'19:30',c:'Coach Rodrigo',sala:'A',cap:9,cup:16,booked:false},
    {t:'20:30',c:'Coach Marina',sala:'B',cap:0,cup:12,booked:false,full:true},
  ];
  return (
    <Phone time="6:14">
      <div className="scroll">
        {/* HEADER */}
        <div style={{padding:'58px 18px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div>
            <div className="eyebrow" style={{color:'var(--text-3)',marginBottom:4}}>SEMANA · 12 — 18 MAY</div>
            <div className="display" style={{fontSize:24,fontWeight:700}}>Reservar clase</div>
          </div>
          <button style={{width:36,height:36,borderRadius:10,background:'var(--card)',border:'1px solid var(--line)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M6 12h12M10 18h4"/></svg>
          </button>
        </div>

        {/* WEEK SCROLL */}
        <div style={{padding:'0 14px 16px'}}>
          <div style={{display:'flex',gap:6,overflowX:'auto',scrollbarWidth:'none'}}>
            {days.map((d,i)=>{
              const active=d.active;
              return (
                <div key={i} style={{
                  flex:'1 0 auto',minWidth:46,padding:'12px 4px',
                  background: active?'var(--grad)':'var(--card)',
                  border: active?'none':'1px solid var(--line)',
                  borderRadius:14,
                  display:'flex',flexDirection:'column',alignItems:'center',gap:3,
                  position:'relative',
                  opacity:d.off?0.5:1,
                  cursor:'pointer'
                }}>
                  <div className="mono" style={{fontSize:9,letterSpacing:'0.1em',fontWeight:700,color:active?'#0a1a14':'var(--text-3)'}}>{d.d}</div>
                  <div className="display" style={{fontSize:18,fontWeight:700,color:active?'#0a1a14':'#fff'}}>{d.n}</div>
                  {d.booked && <div style={{width:5,height:5,borderRadius:'50%',background:'#3aa3ff'}}/>}
                  {!d.booked && !active && <div style={{height:5}}/>}
                </div>
              );
            })}
          </div>
        </div>

        {/* DAY HEADER */}
        <div style={{padding:'4px 18px 12px',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <div className="eyebrow" style={{color:'var(--text-2)'}}>HOY · 14 MAY · 7 CLASES</div>
          <div className="mono" style={{fontSize:10,color:'#19f08b',fontWeight:700}}>1 RESERVADA</div>
        </div>

        {/* SLOTS LIST */}
        <div style={{padding:'0 14px',display:'flex',flexDirection:'column',gap:8}}>
          {slots.map((s,i)=>{
            const fill = s.cap/s.cup;
            return (
              <div key={i} className="card" style={{padding:'14px 16px',position:'relative',opacity:s.past?0.45:1}}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  {/* TIME */}
                  <div style={{width:64,textAlign:'left'}}>
                    <div className="display" style={{fontSize:22,fontWeight:700,color:s.booked?'#19f08b':'#fff',letterSpacing:'-0.03em'}}>{s.t}</div>
                    <div className="mono" style={{fontSize:9,color:'var(--text-3)',letterSpacing:'0.08em',fontWeight:700}}>SALA {s.sala}</div>
                  </div>

                  {/* COACH + CAP */}
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{s.c}</div>
                    {/* capacity bar */}
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,height:4,background:'rgba(255,255,255,0.06)',borderRadius:2,overflow:'hidden'}}>
                        <div style={{
                          height:'100%',width:`${fill*100}%`,
                          background: s.full?'var(--pr)':fill>0.85?'var(--pr)':fill>0.6?'var(--strain)':'var(--recovery)',
                          borderRadius:2
                        }}/>
                      </div>
                      <div className="mono" style={{fontSize:10,color:'var(--text-2)',fontWeight:700,minWidth:40,textAlign:'right'}}>{s.cap}/{s.cup}</div>
                    </div>
                  </div>

                  {/* ACTION */}
                  {s.booked ? (
                    <button style={{background:'var(--grad-soft)',border:'1px solid rgba(25,240,139,0.35)',color:'#19f08b',padding:'8px 12px',borderRadius:9,fontSize:11,fontWeight:700,cursor:'pointer',letterSpacing:'0.04em'}}>RESERVADA ✓</button>
                  ) : s.full ? (
                    <button style={{background:'rgba(255,94,94,0.12)',border:'1px solid rgba(255,94,94,0.3)',color:'#ff5e5e',padding:'8px 12px',borderRadius:9,fontSize:11,fontWeight:700,cursor:'pointer'}}>LISTA</button>
                  ) : s.past ? (
                    <button disabled style={{background:'transparent',border:'1px solid var(--line)',color:'var(--text-3)',padding:'8px 12px',borderRadius:9,fontSize:11,fontWeight:700}}>—</button>
                  ) : (
                    <button style={{background:'var(--grad)',border:'none',color:'#0a1a14',padding:'8px 14px',borderRadius:9,fontSize:11,fontWeight:700,cursor:'pointer',letterSpacing:'0.04em'}}>RESERVAR</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{height:140}}></div>
      </div>
      <TabBar active="reservar"/>
    </Phone>
  );
}
window.KBooking = KBooking;
