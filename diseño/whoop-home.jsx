function WhoopHome(){
  return (
    <div className="phone">
      <div className="island"></div>
      <div className="status"><span>11:16</span><span style={{fontSize:12}}>●●●● 5G ▮</span></div>
      <div className="home-ind"></div>

      <div className="scroll">
        {/* TOP CHIPS HEADER */}
        <div style={{padding:'58px 16px 14px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:30,height:30,borderRadius:'50%',background:'linear-gradient(135deg,#3a3a3a,#1a1a1a)',border:'1px solid rgba(255,255,255,0.15)'}}></div>
            <div style={{display:'flex',alignItems:'center',gap:5,fontSize:13,fontWeight:600}}>
              <span style={{color:'var(--pr)'}}>●</span>
              <span>334</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#13171a',padding:'6px 12px',borderRadius:18,border:'1px solid var(--line)'}}>
            <span style={{fontSize:13,opacity:0.6}}>‹</span>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em'}}>HOY</span>
            <span style={{fontSize:13,opacity:0.6}}>›</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:12,fontWeight:600}}>
            <span style={{color:'var(--recovery)'}}>⚡</span>
            <span>52%</span>
            <span style={{display:'inline-block',width:18,height:10,border:'1px solid rgba(255,255,255,0.4)',borderRadius:2,position:'relative'}}>
              <span style={{position:'absolute',inset:1,width:'52%',background:'var(--recovery)',borderRadius:1}}></span>
            </span>
          </div>
        </div>

        {/* THREE RINGS */}
        <div style={{padding:'12px 0 24px',display:'flex',justifyContent:'space-around'}}>
          <HaloRing value={0.80} color="var(--strain)" big="80%" label="SUEÑO"/>
          <HaloRing value={0.66} color="var(--recovery)" big="66%" label="RECUPERACIÓN"/>
          <HaloRing value={0.75} color="var(--strain)" big="7.5" label="ESFUERZO"/>
        </div>

        {/* HEALTHSPAN BANNER */}
        <div style={{margin:'0 14px 12px'}} className="card">
          <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:14}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Actualización Kronos Edge</div>
              <div style={{fontSize:12,color:'var(--text-2)',lineHeight:1.45}}>Tu plan de fuerza está listo. Mira cómo progresa tu volumen semanal.</div>
              <div style={{marginTop:10,fontSize:12,fontWeight:600,color:'var(--strain)',letterSpacing:'0.04em'}}>VER MÁS  →</div>
            </div>
            <div style={{width:46,height:46,borderRadius:8,background:'linear-gradient(135deg,#1a2230,#0a0d12)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:2,height:24}}>
                {[0.4,0.7,0.5,0.9,0.6,0.8].map((v,i)=>(
                  <div key={i} style={{width:2,height:`${v*100}%`,background:'var(--strain)',borderRadius:1}}/>
                ))}
              </div>
            </div>
            <div style={{position:'absolute',top:10,right:12,background:'rgba(255,255,255,0.08)',padding:'2px 8px',borderRadius:10,fontSize:10,fontWeight:600,display:'flex',alignItems:'center',gap:4}}>
              <span style={{color:'var(--recovery)'}}>✓</span>
              <span>2</span>
            </div>
          </div>
        </div>

        {/* MONITORS ROW */}
        <div style={{padding:'0 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div className="card">
            <div className="card-hd" style={{padding:'12px 14px'}}>
              <span style={{fontSize:10,letterSpacing:'0.12em',fontWeight:700}}>MONITOR<br/>DE CARGA</span>
              <span style={{fontSize:14,opacity:0.4}}>›</span>
            </div>
            <div style={{padding:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                <span style={{color:'var(--recovery)',fontSize:13}}>✓</span>
                <span style={{fontSize:13,fontWeight:600,color:'var(--recovery)'}}>ÓPTIMA</span>
              </div>
              <div style={{fontSize:11,color:'var(--text-2)'}}>5/5 métricas</div>
            </div>
          </div>
          <div className="card">
            <div className="card-hd" style={{padding:'12px 14px'}}>
              <span style={{fontSize:10,letterSpacing:'0.12em',fontWeight:700}}>MONITOR<br/>DE ESTRÉS</span>
              <span style={{fontSize:14,opacity:0.4}}>›</span>
            </div>
            <div style={{padding:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                <span style={{color:'var(--pr)',fontSize:13}}>●</span>
                <span style={{fontSize:13,fontWeight:600,color:'var(--pr)'}}>2.4 ALTO</span>
              </div>
              <div style={{fontSize:11,color:'var(--text-2)'}}>11:13 p.m.</div>
            </div>
          </div>
        </div>

        {/* MI DÍA */}
        <div style={{padding:'10px 16px 12px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:20,fontWeight:700,letterSpacing:'-0.01em'}}>Mi día</div>
          <button style={{width:30,height:30,borderRadius:'50%',background:'#fff',color:'#000',border:'none',fontSize:18,fontWeight:600,cursor:'pointer',lineHeight:1}}>+</button>
        </div>

        {/* WOD card */}
        <div style={{padding:'0 14px 10px'}}>
          <div className="card" style={{position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:'var(--grad-cta-soft)',opacity:0.6}}></div>
            <div style={{position:'relative',padding:'14px 16px',display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:38,height:38,borderRadius:10,background:'var(--grad-cta)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,color:'#0a1a14',fontWeight:800}}>K</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>WOD del día · "Cindy"</div>
                <div style={{fontSize:12,color:'var(--text-2)'}}>AMRAP 20' · 18:30 · 4 cupos</div>
              </div>
              <button className="btn-grad" style={{padding:'8px 14px',borderRadius:8,fontSize:12}}>Reservar</button>
            </div>
          </div>
        </div>

        {/* Sleep card */}
        <div style={{padding:'0 14px 10px'}}>
          <div className="card">
            <div style={{padding:'14px 16px'}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:10,color:'var(--text-2)'}}>El sueño de esta noche</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:18}}>🌙</span>
                  <span style={{fontSize:22,fontWeight:700}}>7:16</span>
                </div>
                <div style={{flex:1,margin:'0 14px',height:1,background:'var(--line)',position:'relative'}}>
                  <div style={{position:'absolute',top:-2,left:'30%',width:5,height:5,borderRadius:'50%',background:'var(--text-3)'}}/>
                  <div style={{position:'absolute',top:-2,left:'85%',width:5,height:5,borderRadius:'50%',background:'var(--text-3)'}}/>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:22,fontWeight:700}}>4:40</span>
                  <span style={{fontSize:18}}>⏰</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PR strip */}
        <div style={{padding:'0 14px 10px'}}>
          <div className="card">
            <div style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:38,height:38,borderRadius:10,background:'rgba(255,94,94,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏆</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>PR · Back Squat</div>
                <div style={{fontSize:12,color:'var(--text-2)'}}>140 kg · hace 3 días · +5kg</div>
              </div>
              <span style={{fontSize:16,opacity:0.5}}>›</span>
            </div>
          </div>
        </div>

        <div style={{height:140}}></div>
      </div>

      <TabBar active="inicio"/>
    </div>
  );
}
window.WhoopHome = WhoopHome;
