function KHome(){
  return (
    <Phone time="6:14">
      <div className="scroll">
        {/* HEADER */}
        <div style={{padding:'58px 18px 14px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:'var(--grad)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:14,color:'#0a1a14',fontFamily:'Space Grotesk'}}>K</div>
            <div>
              <div className="mono" style={{fontSize:9,letterSpacing:'0.14em',color:'var(--text-3)',fontWeight:700}}>BOX · POLANCO</div>
              <div style={{fontSize:13,fontWeight:700}}>Hola, Andrés</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{width:34,height:34,borderRadius:'50%',background:'var(--card)',border:'1px solid var(--line)',color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>
              <span style={{position:'absolute',top:32,right:50,width:6,height:6,borderRadius:'50%',background:'var(--pr)'}}></span>
            </button>
          </div>
        </div>

        {/* WOD POSTER HERO */}
        <div style={{padding:'4px 14px 16px'}}>
          <div style={{position:'relative',borderRadius:18,overflow:'hidden',background:'#101316',border:'1px solid rgba(255,255,255,0.06)'}}>
            {/* gradient backdrop */}
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 80% 0%, rgba(58,163,255,0.35), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(25,240,139,0.25), transparent 60%)'}}></div>
            {/* grid texture */}
            <svg style={{position:'absolute',inset:0,opacity:0.08}} width="100%" height="100%">
              <defs><pattern id="g1" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#fff" strokeWidth="0.5"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#g1)"/>
            </svg>

            <div style={{position:'relative',padding:'18px 20px 20px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
                <span className="chip chip-grad">● WOD · HOY</span>
                <span className="mono" style={{fontSize:10,color:'var(--text-3)',letterSpacing:'0.1em'}}>MIÉ · 14 MAY</span>
              </div>

              <div className="display" style={{fontSize:46,fontWeight:700,lineHeight:0.92,marginBottom:6}}>"Cindy"</div>
              <div className="mono" style={{fontSize:11,color:'#19f08b',letterSpacing:'0.16em',fontWeight:700,marginBottom:18}}>METCON · AMRAP 20:00</div>

              {/* movements stack */}
              <div style={{display:'flex',flexDirection:'column',gap:6,paddingTop:14,borderTop:'1px solid rgba(255,255,255,0.08)'}}>
                {[['5','Pull-ups'],['10','Push-ups'],['15','Air squats']].map(([n,m])=>(
                  <div key={m} style={{display:'flex',alignItems:'baseline',gap:14}}>
                    <div className="display" style={{fontSize:24,fontWeight:700,color:'#3aa3ff',width:34}}>{n}</div>
                    <div style={{fontSize:14,fontWeight:500,color:'rgba(255,255,255,0.92)'}}>{m}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',gap:10,marginTop:20}}>
                <button className="btn-grad" style={{flex:1,padding:'13px',fontSize:13}}>
                  Reservar 18:30 →
                </button>
                <button className="btn-ghost" style={{padding:'13px 16px',fontSize:13}}>Ver WOD</button>
              </div>
            </div>
          </div>
        </div>

        {/* NEXT BOOKING */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card" style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px'}}>
            <div style={{textAlign:'center',padding:'6px 10px',background:'var(--bg-soft)',borderRadius:10,minWidth:54}}>
              <div className="mono" style={{fontSize:9,color:'var(--text-3)',letterSpacing:'0.1em',fontWeight:700}}>HOY</div>
              <div className="display" style={{fontSize:20,fontWeight:700,color:'#19f08b'}}>18:30</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>Tu próxima clase</div>
              <div style={{fontSize:11,color:'var(--text-2)',display:'flex',gap:8,alignItems:'center'}}>
                <span>Coach Rodrigo</span>
                <span style={{opacity:0.4}}>·</span>
                <span>Sala A</span>
                <span style={{opacity:0.4}}>·</span>
                <span style={{color:'#19f08b'}}>● 12/16</span>
              </div>
            </div>
            <button style={{background:'transparent',border:'1px solid var(--line)',color:'var(--text-2)',padding:'7px 12px',borderRadius:8,fontSize:11,cursor:'pointer',fontWeight:600}}>Cancelar</button>
          </div>
        </div>

        {/* WEEK STRIP */}
        <div style={{padding:'4px 18px 8px',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <div className="eyebrow" style={{color:'var(--text-2)'}}>ESTA SEMANA</div>
          <div className="mono" style={{fontSize:10,color:'#19f08b',fontWeight:700,letterSpacing:'0.08em'}}>3/5 ASISTENCIAS</div>
        </div>
        <div style={{padding:'0 14px 14px'}}>
          <div className="card" style={{padding:'16px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',gap:6}}>
              {[
                {d:'L',n:'12',state:'done'},
                {d:'M',n:'13',state:'done'},
                {d:'X',n:'14',state:'today',hour:'18:30'},
                {d:'J',n:'15',state:'free'},
                {d:'V',n:'16',state:'booked',hour:'06:00'},
                {d:'S',n:'17',state:'free'},
                {d:'D',n:'18',state:'rest'},
              ].map((d,i)=>{
                const isToday=d.state==='today',done=d.state==='done',booked=d.state==='booked',rest=d.state==='rest';
                return (
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <div className="mono" style={{fontSize:9,color:'var(--text-3)',letterSpacing:'0.1em',fontWeight:700}}>{d.d}</div>
                    <div style={{
                      width:32,height:32,borderRadius:10,
                      background: isToday?'var(--grad)':done?'rgba(25,240,139,0.18)':booked?'rgba(58,163,255,0.18)':'transparent',
                      border: isToday?'none':done?'1px solid rgba(25,240,139,0.35)':booked?'1px solid rgba(58,163,255,0.35)':'1px solid var(--line)',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:13,fontWeight:700,
                      color: isToday?'#0a1a14':done?'#19f08b':booked?'#3aa3ff':rest?'var(--text-3)':'var(--text-2)',
                    }}>{rest?'·':d.n}</div>
                    <div className="mono" style={{fontSize:8,color:isToday?'#fff':done?'#19f08b':booked?'#3aa3ff':'var(--text-3)',fontWeight:700,height:10}}>
                      {isToday?'HOY':done?'✓':booked?d.hour:rest?'OFF':'—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* LEADERBOARD WOD HOY */}
        <div style={{padding:'4px 18px 8px',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <div className="eyebrow" style={{color:'var(--text-2)'}}>LEADERBOARD · CINDY HOY</div>
          <div className="mono" style={{fontSize:10,color:'var(--text-3)',fontWeight:700,letterSpacing:'0.08em'}}>VER TODOS →</div>
        </div>
        <div style={{padding:'0 14px 14px'}}>
          <div className="card">
            {[
              {pos:1,n:'Mariana V.',sc:'22 + 5',rx:true,you:false},
              {pos:2,n:'Diego H.',sc:'21 + 12',rx:true,you:false},
              {pos:3,n:'Tú · Andrés P.',sc:'17 + 8',rx:true,you:true},
              {pos:4,n:'Sofia R.',sc:'16 + 4',rx:false,you:false},
            ].map((r,i,a)=>(
              <div key={r.pos} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',borderBottom:i<a.length-1?'1px solid var(--line)':'none',background:r.you?'var(--grad-soft)':'transparent'}}>
                <div className="display" style={{fontSize:18,fontWeight:700,width:22,color:r.pos<=3?'#19f08b':'var(--text-3)'}}>{r.pos}</div>
                <div style={{width:28,height:28,borderRadius:'50%',background:'var(--bg-soft)',border:'1px solid var(--line)'}}></div>
                <div style={{flex:1,fontSize:13,fontWeight:r.you?700:500}}>{r.n}</div>
                <span className={`chip ${r.rx?'chip-grad':'chip-ghost'}`} style={{padding:'3px 8px',fontSize:9}}>{r.rx?'RX':'SC'}</span>
                <div className="display" style={{fontSize:14,fontWeight:700,minWidth:54,textAlign:'right',color:r.you?'#19f08b':'#fff'}}>{r.sc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* PR ATAJO */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card" style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px'}}>
            <div style={{width:42,height:42,borderRadius:11,background:'rgba(255,94,94,0.15)',border:'1px solid rgba(255,94,94,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff5e5e" strokeWidth="2"><path d="M6 9V5h12v4M5 9h14v4H5zM7 13l1 8h8l1-8"/></svg>
            </div>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:2}}>
                <span style={{fontSize:13,fontWeight:600}}>Back Squat</span>
                <span className="chip chip-pr" style={{padding:'2px 6px',fontSize:9}}>PR · +5KG</span>
              </div>
              <div className="mono" style={{fontSize:10,color:'var(--text-2)',letterSpacing:'0.06em'}}>140 KG · HACE 3 DÍAS</div>
            </div>
            <span style={{fontSize:18,opacity:0.4}}>›</span>
          </div>
        </div>

        <div style={{height:140}}></div>
      </div>
      <TabBar active="inicio"/>
    </Phone>
  );
}
window.KHome = KHome;
