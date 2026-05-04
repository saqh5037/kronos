// Whoop-faithful primitives

function HaloRing({size=88,stroke=8,value=0.8,color='var(--recovery)',glow=true,label,big}){
  const r=(size-stroke)/2;
  const c=2*Math.PI*r;
  return (
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center'}}>
      {glow && <div style={{position:'absolute',inset:-8,borderRadius:'50%',background:`radial-gradient(circle, ${color === 'var(--recovery)' ? 'rgba(25,240,139,0.25)' : color === 'var(--strain)' ? 'rgba(58,163,255,0.25)' : 'rgba(93,108,255,0.22)'} 0%, transparent 65%)`,filter:'blur(6px)'}}/>}
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'relative',zIndex:1}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c*(1-value)} strokeLinecap="round"
          style={{filter:`drop-shadow(0 0 6px ${color === 'var(--recovery)' ? 'rgba(25,240,139,0.6)' : color === 'var(--strain)' ? 'rgba(58,163,255,0.6)' : 'rgba(93,108,255,0.6)'})`}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',zIndex:2}}>
        <div style={{fontSize:size>110?22:18,fontWeight:700,letterSpacing:'-0.02em'}}>{big}</div>
        <div style={{fontSize:9,letterSpacing:'0.14em',color:'var(--text-3)',fontWeight:600,marginTop:2}}>{label}</div>
      </div>
    </div>
  );
}

function Sparkline({values, color, height=36}){
  const max=Math.max(...values), min=Math.min(...values);
  const w=140, h=height;
  const pts = values.map((v,i)=>{
    const x=(i/(values.length-1))*w;
    const y=h - ((v-min)/(max-min||1))*h;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{display:'block'}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

function TabBar({active='inicio'}){
  const ItHome=()=><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H10v7H4a1 1 0 0 1-1-1z"/></svg>;
  const ItHeart=()=><svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>;
  const ItGroup=()=><svg viewBox="0 0 24 24"><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 19c.5-3 3-5 6-5s5.5 2 6 5"/><path d="M14 19c.4-2 2-3.5 4-3.5s3.5 1.5 4 3.5"/></svg>;
  const ItMenu=()=><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
  const tabs=[
    {id:'inicio',l:'Inicio',I:ItHome},
    {id:'salud',l:'Salud',I:ItHeart},
    {id:'comunidad',l:'Comunidad',I:ItGroup},
    {id:'mas',l:'Más',I:ItMenu},
  ];
  return (
    <>
      <div className="tabbar">
        {tabs.map(t=>(
          <button key={t.id} className={`tab ${active===t.id?'active':''}`}>
            <t.I/>
            <span>{t.l}</span>
          </button>
        ))}
        <div style={{width:54}}></div>
      </div>
      <div className="fab"><div className="fab-inner"><span className="w">K</span></div></div>
    </>
  );
}

window.HaloRing = HaloRing;
window.Sparkline = Sparkline;
window.TabBar = TabBar;
