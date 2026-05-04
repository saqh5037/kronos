function KWod(){
  const movements = [
    {n:'5',m:'Pull-ups',rx:'Estricto',sc:'Banda verde'},
    {n:'10',m:'Push-ups',rx:'Pecho-piso',sc:'Rodillas'},
    {n:'15',m:'Air squats',rx:'Profundidad',sc:'A caja'},
  ];
  return (
    <Phone time="6:14">
      <div className="scroll">
        {/* HEADER */}
        <div style={{padding:'58px 14px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <button style={{width:36,height:36,borderRadius:10,background:'var(--card)',border:'1px solid var(--line)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
          <div className="eyebrow" style={{color:'var(--text-2)'}}>WOD · 14 MAY</div>
          <button style={{width:36,height:36,borderRadius:10,background:'var(--card)',border:'1px solid var(--line)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
        </div>

        {/* HERO POSTER */}
        <div style={{padding:'12px 14px 16px'}}>
          <div style={{position:'relative',borderRadius:18,overflow:'hidden',background:'#101316',border:'1px solid rgba(255,255,255,0.06)',padding:'22px 22px 24px'}}>
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 80% 0%, rgba(58,163,255,0.32), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(25,240,139,0.22), transparent 60%)'}}></div>
            <svg style={{position:'absolute',inset:0,opacity:0.07}} width="100%" height="100%">
              <defs><pattern id="g2" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M 22 0 L 0 0 0 22" fill="none" stroke="#fff" strokeWidth="0.5"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#g2)"/>
            </svg>

            <div style={{position:'relative'}}>
              <span className="chip chip-grad" style={{marginBottom:14}}>● BENCHMARK · GIRL WOD</span>
              <div className="display" style={{fontSize:60,fontWeight:700,lineHeight:0.92,marginTop:14,letterSpacing:'-0.04em'}}>"Cindy"</div>
              <div className="mono" style={{fontSize:11,color:'#19f08b',letterSpacing:'0.18em',fontWeight:700,marginTop:8}}>METCON · AMRAP 20:00</div>

              <div style={{display:'flex',gap:18,marginTop:22,paddingTop:18,borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                {[
                  {l:'TIEMPO',v:'20:00'},
                  {l:'TIPO',v:'AMRAP'},
                  {l:'NIVEL',v:'INT.'},
                ].map(s=>(
                  <div key={s.l}>
                    <div className="mono" style={{fontSize:9,color:'var(--text-3)',letterSpacing:'0.14em',fontWeight:700}}>{s.l}</div>
                    <div className="display" style={{fontSize:18,fontWeight:700,marginTop:3}}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MOVIMIENTOS */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card">
            <div className="card-hd">
              <span className="eyebrow">/01 MOVIMIENTOS · POR RONDA</span>
              <span className="mono" style={{fontSize:9,color:'var(--text-3)',fontWeight:700,letterSpacing:'0.1em'}}>RX · SC</span>
            </div>
            {movements.map((mv,i,a)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderBottom:i<a.length-1?'1px solid var(--line)':'none'}}>
                <div className="display" style={{fontSize:32,fontWeight:700,color:'#3aa3ff',width:42,letterSpacing:'-0.03em'}}>{mv.n}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:3}}>{mv.m}</div>
                  <div className="mono" style={{fontSize:10,color:'var(--text-3)',display:'flex',gap:8,fontWeight:600,letterSpacing:'0.04em'}}>
                    <span><span style={{color:'#19f08b'}}>RX</span> {mv.rx}</span>
                    <span style={{opacity:0.4}}>·</span>
                    <span><span style={{color:'#3aa3ff'}}>SC</span> {mv.sc}</span>
                  </div>
                </div>
                <button style={{background:'rgba(255,255,255,0.06)',border:'none',color:'#fff',width:32,height:32,borderRadius:'50%',fontSize:11,cursor:'pointer'}}>▶</button>
              </div>
            ))}
          </div>
        </div>

        {/* TU HISTORIAL */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card">
            <div className="card-hd">
              <span className="eyebrow">/02 TU HISTORIAL</span>
              <span className="mono" style={{fontSize:10,color:'#19f08b',fontWeight:700,letterSpacing:'0.08em'}}>+42% PROGRESO</span>
            </div>
            <div style={{padding:'18px 16px'}}>
              <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:14}}>
                <span className="mono" style={{fontSize:10,color:'var(--text-3)',fontWeight:700,letterSpacing:'0.12em'}}>PR ACTUAL</span>
                <span className="display" style={{fontSize:28,fontWeight:700,letterSpacing:'-0.02em'}}>17 + 8</span>
                <span style={{fontSize:11,color:'var(--text-2)'}}>rondas</span>
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:8,height:54,marginBottom:8}}>
                {[
                  {v:0.45,pr:false},
                  {v:0.70,pr:false},
                  {v:1.0,pr:true},
                ].map((b,i)=>(
                  <div key={i} style={{flex:1,position:'relative'}}>
                    <div style={{width:'100%',height:`${b.v*100}%`,background:b.pr?'var(--grad)':'rgba(255,255,255,0.12)',borderRadius:3,minHeight:8,boxShadow:b.pr?'0 0 14px rgba(25,240,139,0.5)':'none'}}/>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:8}}>
                {[
                  {l:'12 RDS',d:'12 mar'},
                  {l:'15 RDS',d:'24 abr'},
                  {l:'17+8',d:'7 may',pr:true},
                ].map((b,i)=>(
                  <div key={i} style={{flex:1,textAlign:'center'}}>
                    <div className="mono" style={{fontSize:11,fontWeight:700,color:b.pr?'#19f08b':'var(--text-2)',letterSpacing:'0.04em'}}>{b.l}</div>
                    <div className="mono" style={{fontSize:9,color:'var(--text-3)',marginTop:2}}>{b.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COACH NOTES */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card" style={{padding:'16px',display:'flex',gap:12}}>
            <div style={{width:38,height:38,borderRadius:'50%',background:'var(--grad)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:13,color:'#0a1a14',flexShrink:0}}>RM</div>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                <div style={{fontSize:13,fontWeight:700}}>Coach Rodrigo</div>
                <div className="mono" style={{fontSize:9,color:'var(--text-3)',letterSpacing:'0.08em'}}>NOTA · 18:30</div>
              </div>
              <div style={{fontSize:12,color:'var(--text-2)',lineHeight:1.5}}>
                Hoy ritmo constante. Rompan en sets de 3-3-4 las pull-ups desde la primera ronda. No empiecen sprintando.
              </div>
            </div>
          </div>
        </div>

        <div style={{height:160}}></div>
      </div>

      {/* CTA */}
      <div style={{position:'absolute',bottom:88,left:0,right:0,padding:'14px 14px',background:'linear-gradient(180deg,transparent,var(--bg) 50%)',zIndex:30}}>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-grad" style={{flex:1}}>Reservar 18:30 →</button>
          <button className="btn-ghost" style={{padding:'14px 16px'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4v16l7-5 7 5V4z"/></svg>
          </button>
        </div>
      </div>

      <TabBar active="wod"/>
    </Phone>
  );
}
window.KWod = KWod;
