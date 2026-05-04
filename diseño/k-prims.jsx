// Kronos primitives

function Phone({children, time='6:14', pad='top'}){
  return (
    <div className="phone">
      <div className="island"></div>
      <div className="status"><span>{time}</span><span style={{fontSize:12}}>●●●● 5G ▮</span></div>
      <div className="home-ind"></div>
      {children}
    </div>
  );
}

function TabBar({active='inicio'}){
  const ItHome=()=><svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H10v7H4a1 1 0 0 1-1-1z"/></svg>;
  const ItCal=()=><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
  const ItWod=()=><svg viewBox="0 0 24 24"><path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/></svg>;
  const ItUser=()=><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7"/></svg>;
  const tabs=[
    {id:'inicio',l:'Inicio',I:ItHome},
    {id:'reservar',l:'Reservar',I:ItCal},
    {id:'wod',l:'WOD',I:ItWod},
    {id:'atleta',l:'Atleta',I:ItUser},
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
      <button className="fab" onClick={()=>{}}>
        <div className="fab-inner"><span className="fab-K">K</span></div>
      </button>
    </>
  );
}

function HaloRing({size=88,stroke=8,value=0.8,color='#19f08b',big,label,glowColor}){
  const r=(size-stroke)/2;
  const c=2*Math.PI*r;
  const gc = glowColor || (color==='#19f08b'?'rgba(25,240,139,0.55)':color==='#3aa3ff'?'rgba(58,163,255,0.55)':'rgba(255,94,94,0.55)');
  return (
    <div style={{position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{position:'absolute',inset:-6,borderRadius:'50%',background:`radial-gradient(circle, ${gc.replace('0.55','0.22')} 0%, transparent 65%)`,filter:'blur(6px)'}}/>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)',position:'relative'}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c*(1-value)} strokeLinecap="round"
          style={{filter:`drop-shadow(0 0 6px ${gc})`}}/>
      </svg>
      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
        <div className="display" style={{fontSize:size>110?22:16,fontWeight:700}}>{big}</div>
        <div style={{fontSize:8,letterSpacing:'0.14em',color:'rgba(255,255,255,0.5)',fontWeight:700,marginTop:1}}>{label}</div>
      </div>
    </div>
  );
}

window.Phone = Phone;
window.TabBar = TabBar;
window.HaloRing = HaloRing;
