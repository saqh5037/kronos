function KAtleta(){
  const prs = [
    {l:'Back Squat',v:'140',u:'kg',d:'+5 hace 3d',new:true},
    {l:'Deadlift',v:'180',u:'kg',d:'hace 12d'},
    {l:'Snatch',v:'82',u:'kg',d:'hace 1m'},
    {l:'Clean & Jerk',v:'105',u:'kg',d:'+2 hace 8d',new:true},
    {l:'Fran',v:'4:12',u:'',d:'hace 21d'},
    {l:'Murph',v:'42:08',u:'',d:'hace 2m'},
  ];
  return (
    <Phone time="6:14">
      <div className="scroll">
        {/* HEADER + AVATAR */}
        <div style={{padding:'58px 18px 18px'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <div style={{position:'relative'}}>
              <div style={{width:64,height:64,borderRadius:'50%',background:'var(--grad)',padding:2}}>
                <div style={{width:'100%',height:'100%',borderRadius:'50%',background:'var(--card)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Grotesk',fontWeight:700,fontSize:22}}>AP</div>
              </div>
              <div style={{position:'absolute',bottom:-2,right:-2,background:'var(--bg)',borderRadius:'50%',padding:2}}>
                <div style={{width:18,height:18,borderRadius:'50%',background:'var(--recovery)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#0a1a14',fontWeight:800}}>✓</div>
              </div>
            </div>
            <div style={{flex:1}}>
              <div className="display" style={{fontSize:22,fontWeight:700}}>Andrés Pérez</div>
              <div className="mono" style={{fontSize:10,color:'var(--text-3)',letterSpacing:'0.1em',fontWeight:700}}>ATLETA · NIVEL INT · 14 MESES</div>
            </div>
            <button style={{width:36,height:36,borderRadius:10,background:'var(--card)',border:'1px solid var(--line)',color:'#fff',cursor:'pointer'}}>⚙</button>
          </div>
        </div>

        {/* RACHA + STREAK */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card" style={{padding:'18px 18px',position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',inset:0,background:'var(--grad-soft)',opacity:0.5}}></div>
            <div style={{position:'relative',display:'flex',alignItems:'center',gap:18}}>
              <div className="display" style={{fontSize:60,fontWeight:700,letterSpacing:'-0.04em',background:'var(--grad)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent',lineHeight:1}}>14</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Días de racha</div>
                <div style={{fontSize:11,color:'var(--text-2)',lineHeight:1.45}}>Tu racha más larga: <strong style={{color:'#19f08b'}}>23 días</strong>. Vas por buen camino — no rompas hoy.</div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS GRID */}
        <div style={{padding:'0 14px 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {[
            {l:'ASISTENCIAS',v:'58',d:'ESTE TRIM.',c:'#19f08b'},
            {l:'WODS RX',v:'72%',d:'+8% vs Q1',c:'#3aa3ff'},
            {l:'VOLUMEN',v:'24.8t',d:'90 DÍAS',c:'#19f08b'},
            {l:'PRs',v:'12',d:'2025',c:'#ff5e5e'},
          ].map(s=>(
            <div key={s.l} className="card" style={{padding:'14px 16px'}}>
              <div className="mono" style={{fontSize:9,letterSpacing:'0.14em',color:s.c,fontWeight:700,marginBottom:8}}>{s.l}</div>
              <div className="display" style={{fontSize:26,fontWeight:700,letterSpacing:'-0.02em',marginBottom:4}}>{s.v}</div>
              <div className="mono" style={{fontSize:9,color:'var(--text-3)',letterSpacing:'0.08em',fontWeight:700}}>{s.d}</div>
            </div>
          ))}
        </div>

        {/* PROGRESO BACK SQUAT */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card">
            <div className="card-hd">
              <span className="eyebrow">PROGRESO · BACK SQUAT</span>
              <span className="mono" style={{fontSize:10,color:'#19f08b',fontWeight:700,letterSpacing:'0.08em'}}>+18 KG · 12 MESES</span>
            </div>
            <div style={{padding:'16px'}}>
              <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80}}>
                {[
                  0.55,0.58,0.62,0.60,0.66,0.70,0.73,0.78,0.82,0.85,0.92,1.0
                ].map((v,i,a)=>(
                  <div key={i} style={{flex:1,height:`${v*100}%`,background:i===a.length-1?'var(--grad)':'rgba(255,255,255,0.12)',borderRadius:3,minHeight:6,boxShadow:i===a.length-1?'0 0 12px rgba(25,240,139,0.45)':'none'}}/>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginTop:10}}>
                <div className="mono" style={{fontSize:9,color:'var(--text-3)',letterSpacing:'0.08em',fontWeight:700}}>122 KG · MAY '24</div>
                <div className="mono" style={{fontSize:9,color:'#19f08b',letterSpacing:'0.08em',fontWeight:700}}>140 KG · HOY</div>
              </div>
            </div>
          </div>
        </div>

        {/* PRs GRID */}
        <div style={{padding:'4px 18px 8px',display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <div className="eyebrow" style={{color:'var(--text-2)'}}>RECORDS PERSONALES</div>
          <div className="mono" style={{fontSize:10,color:'var(--text-3)',fontWeight:700,letterSpacing:'0.08em'}}>VER TODOS →</div>
        </div>
        <div style={{padding:'0 14px 14px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {prs.map(pr=>(
            <div key={pr.l} className="card" style={{padding:'12px 14px',position:'relative'}}>
              {pr.new && <div style={{position:'absolute',top:8,right:8,width:6,height:6,borderRadius:'50%',background:'#ff5e5e',boxShadow:'0 0 8px rgba(255,94,94,0.7)'}}></div>}
              <div style={{fontSize:11,color:'var(--text-2)',fontWeight:600,marginBottom:6}}>{pr.l}</div>
              <div style={{display:'flex',alignItems:'baseline',gap:4,marginBottom:4}}>
                <span className="display" style={{fontSize:24,fontWeight:700,letterSpacing:'-0.02em'}}>{pr.v}</span>
                <span className="mono" style={{fontSize:11,color:'var(--text-3)',fontWeight:700}}>{pr.u}</span>
              </div>
              <div className="mono" style={{fontSize:9,color:pr.new?'#ff5e5e':'var(--text-3)',letterSpacing:'0.06em',fontWeight:700}}>{pr.d.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* MEMBRESIA */}
        <div style={{padding:'0 14px 14px'}}>
          <div className="card" style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:38,height:38,borderRadius:10,background:'rgba(58,163,255,0.15)',border:'1px solid rgba(58,163,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3aa3ff" strokeWidth="2"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>Membresía Unlimited</div>
              <div className="mono" style={{fontSize:10,color:'var(--text-2)',letterSpacing:'0.04em'}}>RENUEVA · 30 MAY · $1,890 MXN</div>
            </div>
            <span style={{fontSize:18,opacity:0.4}}>›</span>
          </div>
        </div>

        <div style={{height:140}}></div>
      </div>
      <TabBar active="atleta"/>
    </Phone>
  );
}
window.KAtleta = KAtleta;
