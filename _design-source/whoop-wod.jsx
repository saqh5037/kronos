function WhoopWod(){
  const movements = [
    {n:'5',m:'Pull-ups',rx:'Estricto',sc:'Banda verde'},
    {n:'10',m:'Push-ups',rx:'Pecho-piso',sc:'Rodillas'},
    {n:'15',m:'Air squats',rx:'Profundidad',sc:'A caja'},
  ];
  return (
    <div className="phone">
      <div className="island"></div>
      <div className="status"><span>11:17</span><span style={{fontSize:12}}>●●●● 5G ▮</span></div>
      <div className="home-ind"></div>

      <div className="scroll">
        {/* HEADER */}
        <div style={{padding:'58px 16px 8px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <button style={{background:'transparent',border:'none',color:'#fff',fontSize:22,cursor:'pointer'}}>‹</button>
          <div style={{fontSize:11,letterSpacing:'0.14em',fontWeight:700,color:'var(--text-2)'}}>WOD</div>
          <button style={{background:'transparent',border:'none',color:'#fff',fontSize:18,cursor:'pointer'}}>···</button>
        </div>

        {/* HERO TITLE */}
        <div style={{padding:'12px 16px 18px'}}>
          <div style={{fontSize:11,letterSpacing:'0.16em',color:'var(--strain)',fontWeight:700,marginBottom:8}}>METCON · AMRAP 20'</div>
          <div style={{fontSize:38,fontWeight:800,letterSpacing:'-0.02em',lineHeight:1}}>"Cindy"</div>
          <div style={{fontSize:13,color:'var(--text-2)',marginTop:10,lineHeight:1.45}}>
            Benchmark girl. Tantas rondas como sea posible en 20 minutos.
          </div>
        </div>

        {/* PROJECTION RING + STATS */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card">
            <div className="card-hd">
              <span className="card-title">PROYECCIÓN PARA HOY</span>
              <span style={{fontSize:14,opacity:0.4}}>›</span>
            </div>
            <div style={{padding:'18px 16px',display:'flex',alignItems:'center',gap:18}}>
              <HaloRing size={104} stroke={9} value={0.71} color="var(--strain)" big="14.2" label="ESFUERZO"/>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:14}}>
                {[
                  {l:'Kcal',v:'~340',c:'var(--recovery)'},
                  {l:'BPM avg',v:'162',c:'var(--strain)'},
                  {l:'Recuperación',v:'-12%',c:'var(--pr)'},
                ].map(s=>(
                  <div key={s.l} style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
                    <span style={{fontSize:12,color:'var(--text-2)'}}>{s.l}</span>
                    <span style={{fontSize:15,fontWeight:700,color:s.c}}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* MOVEMENTS */}
        <div style={{padding:'0 14px 12px'}}>
          <div className="card">
            <div className="card-hd">
              <span className="card-title">MOVIMIENTOS · POR RONDA</span>
              <span style={{fontSize:10,fontWeight:700,color:'var(--text-3)'}}>RX · SC</span>
            </div>
            <div style={{padding:'4px 0'}}>
              {movements.map((mv,i)=>(
                <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderBottom:i<movements.length-1?'1px solid var(--line)':'none'}}>
                  <div style={{fontSize:32,fontWeight:800,color:'var(--strain)',width:42,letterSpacing:'-0.04em'}}>{mv.n}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:600,marginBottom:3}}>{mv.m}</div>
                    <div style={{fontSize:11,color:'var(--text-3)',display:'flex',gap:8}}>
                      <span><span style={{color:'var(--recovery)'}}>RX</span> {mv.rx}</span>
                      <span style={{opacity:0.4}}>·</span>
                      <span><span style={{color:'var(--strain)'}}>SC</span> {mv.sc}</span>
                    </div>
                  </div>
                  <button style={{background:'rgba(255,255,255,0.06)',border:'none',color:'#fff',width:30,height:30,borderRadius:'50%',fontSize:11,cursor:'pointer'}}>▶</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* HISTORY */}
        <div style={{padding:'0 14px 12px'}}>
          <div className="card">
            <div className="card-hd">
              <span className="card-title">TU HISTORIAL · 3 SESIONES</span>
              <span style={{fontSize:10,color:'var(--recovery)',fontWeight:700,letterSpacing:'0.08em'}}>+42% PROGRESO</span>
            </div>
            <div style={{padding:'18px 16px'}}>
              <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:14}}>
                <span style={{fontSize:11,color:'var(--text-3)',fontWeight:700,letterSpacing:'0.1em'}}>PR ACTUAL</span>
                <span style={{fontSize:26,fontWeight:800,letterSpacing:'-0.02em'}}>17 + 8</span>
                <span style={{fontSize:11,color:'var(--text-2)'}}>rondas</span>
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:8,height:54,marginBottom:8}}>
                {[
                  {v:0.45,l:'12 RDS',d:'12 mar'},
                  {v:0.70,l:'15 RDS',d:'24 abr'},
                  {v:1.0,l:'17+8',d:'7 may',pr:true},
                ].map((b,i)=>(
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <div style={{width:'100%',height:`${b.v*100}%`,background:b.pr?'var(--recovery)':'rgba(255,255,255,0.15)',borderRadius:3,minHeight:8,position:'relative'}}>
                      {b.pr && <div style={{position:'absolute',inset:0,boxShadow:'0 0 12px rgba(25,240,139,0.5)',borderRadius:3}}/>}
                    </div>
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
                    <div style={{fontSize:11,fontWeight:700,color:b.pr?'var(--recovery)':'var(--text-2)'}}>{b.l}</div>
                    <div style={{fontSize:10,color:'var(--text-3)'}}>{b.d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* COACH */}
        <div style={{padding:'0 14px 12px'}}>
          <div className="card">
            <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:38,height:38,borderRadius:'50%',background:'linear-gradient(135deg,#3aa3ff,#1a4a8a)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13}}>RM</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600}}>Coach Rodrigo M.</div>
                <div style={{fontSize:11,color:'var(--text-2)'}}>Sesión 18:30 · 12/16 reservados</div>
              </div>
              <div style={{fontSize:10,color:'var(--recovery)',fontWeight:700,letterSpacing:'0.08em'}}>● 4 CUPOS</div>
            </div>
          </div>
        </div>

        <div style={{height:160}}></div>
      </div>

      {/* CTA */}
      <div style={{position:'absolute',bottom:88,left:0,right:0,padding:'12px 14px',background:'linear-gradient(180deg,transparent,var(--bg) 50%)',zIndex:30}}>
        <button className="btn-grad" style={{width:'100%',padding:'16px',borderRadius:12,fontSize:15,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>Reservar 18:30</span>
          <span style={{fontSize:12,opacity:0.85,fontWeight:600}}>4 CUPOS  →</span>
        </button>
      </div>

      <TabBar active="salud"/>
    </div>
  );
}
window.WhoopWod = WhoopWod;
