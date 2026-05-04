// Kronos — shared atoms (icons, glyph, data)

// ─── Kronos glyph (clepsidra geométrica) ───
function KGlyph({ size = 18, color = 'currentColor', stroke = 1.5 }) {
  return (
    <svg className="k-glyph" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 3h14M5 21h14" stroke={color} strokeWidth={stroke} strokeLinecap="round"/>
      <path d="M6 3c0 5 6 7 6 9s-6 4-6 9" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 3c0 5-6 7-6 9s6 4 6 9" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="0.9" fill={color} stroke="none"/>
    </svg>
  );
}

// ─── Wordmark ───
function Wordmark({ size = 22 }) {
  return (
    <span className="wordmark" style={{ fontSize: size }}>
      <KGlyph size={size * 0.85} stroke={1.3}/>
      <span>KRONOS</span>
    </span>
  );
}

// ─── Icons (1.5px line, geometric) ───
const Icon = {
  home: (s = 22, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  calendar: (s = 22, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke={c} strokeWidth="1.5"/>
      <path d="M3 9h18M8 3v4M16 3v4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  flame: (s = 22, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 3c2 4 6 5 6 10a6 6 0 11-12 0c0-3 2-4 3-6 1 2 1.5 3 3-4z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  user: (s = 22, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="4" stroke={c} strokeWidth="1.5"/>
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  card: (s = 22, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke={c} strokeWidth="1.5"/>
      <path d="M3 11h18M7 16h4" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  chevronR: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronL: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M15 6l-6 6 6 6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={c} strokeWidth="1.5"/>
      <path d="M12 7v5l3 2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  pin: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="12" cy="10" r="2.5" stroke={c} strokeWidth="1.5"/>
    </svg>
  ),
  users: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="3.5" stroke={c} strokeWidth="1.5"/>
      <path d="M3 19c.8-3 3-5 6-5s5.2 2 6 5" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M16 5a3 3 0 010 6M22 19c-.5-2-2-3.5-4-4.2" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  plus: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  check: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l5 5 9-11" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  bell: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 16V11a6 6 0 1112 0v5l1.5 2H4.5L6 16z" stroke={c} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M10 21a2 2 0 004 0" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  trend: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 18l6-6 4 4 8-8" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 8h7v7" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  scythe: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 18l16-12" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M20 6c-3-1-7 0-10 3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  podium: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="6" width="6" height="14" stroke={c} strokeWidth="1.5"/>
      <rect x="3" y="11" width="6" height="9" stroke={c} strokeWidth="1.5"/>
      <rect x="15" y="14" width="6" height="6" stroke={c} strokeWidth="1.5"/>
    </svg>
  ),
  weight: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="9" width="3" height="6" stroke={c} strokeWidth="1.5"/>
      <rect x="19" y="9" width="3" height="6" stroke={c} strokeWidth="1.5"/>
      <path d="M5 12h14" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="7" y="7" width="2.5" height="10" stroke={c} strokeWidth="1.5"/>
      <rect x="14.5" y="7" width="2.5" height="10" stroke={c} strokeWidth="1.5"/>
    </svg>
  ),
  play: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <path d="M7 4l13 8-13 8z"/>
    </svg>
  ),
  refresh: (s = 16, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M3 12a9 9 0 0115-6l3 3M21 12a9 9 0 01-15 6l-3-3" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 3v6h-6M3 21v-6h6" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  more: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}>
      <circle cx="5" cy="12" r="1.5"/>
      <circle cx="12" cy="12" r="1.5"/>
      <circle cx="19" cy="12" r="1.5"/>
    </svg>
  ),
  sliders: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M4 6h11M19 6h1M4 12h5M13 12h7M4 18h13M21 18h-1" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="17" cy="6" r="2" stroke={c} strokeWidth="1.5"/>
      <circle cx="11" cy="12" r="2" stroke={c} strokeWidth="1.5"/>
      <circle cx="19" cy="18" r="2" stroke={c} strokeWidth="1.5"/>
    </svg>
  ),
};

// ─── Status bar (custom, matches kronos) ───
function StatusBar({ time = '6:42' }) {
  return (
    <div className="status-bar">
      <span className="mono" style={{ fontSize: 14, letterSpacing: '0.02em', fontWeight: 500 }}>{time}</span>
      <div className="right">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.5"/>
          <rect x="4.5" y="5" width="3" height="6" rx="0.5"/>
          <rect x="9" y="2.5" width="3" height="8.5" rx="0.5"/>
          <rect x="13.5" y="0" width="3" height="11" rx="0.5"/>
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
          <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/>
          <rect x="2" y="2" width="17" height="7" rx="1" fill="currentColor"/>
          <path d="M22 4v3" stroke="currentColor" strokeOpacity="0.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Phone shell ───
function Phone({ children, time = '6:42' }) {
  return (
    <div className="phone">
      <div className="island"></div>
      <StatusBar time={time}/>
      <div className="screen">{children}</div>
      <div className="home-indicator"></div>
    </div>
  );
}

// ─── Tab bar ───
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'home', label: 'Hoy', icon: Icon.home },
    { id: 'calendar', label: 'Reservar', icon: Icon.calendar },
    { id: 'wod', label: 'WOD', icon: Icon.flame },
    { id: 'profile', label: 'Atleta', icon: Icon.user },
    { id: 'pay', label: 'Cuenta', icon: Icon.card },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button
          key={t.id}
          className={'tab' + (active === t.id ? ' active' : '')}
          onClick={() => onChange(t.id)}
        >
          {t.icon(22)}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Sample data ───
const ATHLETES = [
  { id: 'me', name: 'Diego Velázquez', initials: 'DV', img: null, you: true },
  { id: 'a2', name: 'Valentina Ríos', initials: 'VR' },
  { id: 'a3', name: 'Mateo Aguilar', initials: 'MA' },
  { id: 'a4', name: 'Camila Ortega', initials: 'CO' },
  { id: 'a5', name: 'Andrés Lozano', initials: 'AL' },
  { id: 'a6', name: 'Sofía Mendoza', initials: 'SM' },
  { id: 'a7', name: 'Renata Pacheco', initials: 'RP' },
  { id: 'a8', name: 'Joaquín Téllez', initials: 'JT' },
  { id: 'a9', name: 'Lucía Cárdenas', initials: 'LC' },
  { id: 'a10', name: 'Emiliano Bravo', initials: 'EB' },
  { id: 'a11', name: 'Paula Cervantes', initials: 'PC' },
  { id: 'a12', name: 'Tomás Iglesias', initials: 'TI' },
];

// Today: Friday 02 May 2026
const WOD_TODAY = {
  name: 'Fran',
  type: 'For Time',
  category: 'Benchmark · The Girls',
  cap: 12,
  description: '21-15-9 reps for time of:',
  movements: [
    { name: 'Thrusters', spec: '43 / 30 kg', subtitle: 'Front rack al overhead' },
    { name: 'Pull-ups', spec: 'RX strict · Scaled banda', subtitle: 'Cuerpo recto, mentón sobre la barra' },
  ],
  notes: 'Termina rápido. Elige peso que te permita series ininterrumpidas. El primer round es más lento de lo que crees.',
  history: [
    { date: '12 NOV 2025', time: '6:42', rx: true },
    { date: '08 ABR 2025', time: '7:18', rx: true },
    { date: '14 OCT 2024', time: '8:04', rx: false },
  ],
};

const SCHEDULE = [
  // Today — Vie 02
  { id: 'c1', time: '06:00', day: 0, coach: 'Andrés L.', spots: 14, taken: 14, wod: 'Fran', kind: 'CrossFit' },
  { id: 'c2', time: '07:00', day: 0, coach: 'Renata P.', spots: 14, taken: 11, wod: 'Fran', kind: 'CrossFit' },
  { id: 'c3', time: '12:00', day: 0, coach: 'Andrés L.', spots: 14, taken: 8, wod: 'Fran', kind: 'CrossFit', mine: true },
  { id: 'c4', time: '17:00', day: 0, coach: 'Mateo A.', spots: 14, taken: 13, wod: 'Fran', kind: 'CrossFit' },
  { id: 'c5', time: '18:00', day: 0, coach: 'Renata P.', spots: 14, taken: 14, wod: 'Fran', kind: 'CrossFit' },
  { id: 'c6', time: '19:00', day: 0, coach: 'Mateo A.', spots: 14, taken: 9, wod: 'Fran', kind: 'CrossFit' },
  // Sáb 03
  { id: 'c10', time: '08:00', day: 1, coach: 'Renata P.', spots: 18, taken: 18, wod: 'Partner WOD', kind: 'Partner' },
  { id: 'c11', time: '09:30', day: 1, coach: 'Renata P.', spots: 18, taken: 12, wod: 'Partner WOD', kind: 'Partner' },
  { id: 'c12', time: '11:00', day: 1, coach: 'Andrés L.', spots: 14, taken: 6, wod: 'Open Gym', kind: 'Open Gym' },
  // Lun 05
  { id: 'c20', time: '06:00', day: 3, coach: 'Andrés L.', spots: 14, taken: 7, wod: 'Strength · Back Squat', kind: 'Strength' },
  { id: 'c21', time: '07:00', day: 3, coach: 'Renata P.', spots: 14, taken: 9, wod: 'Strength · Back Squat', kind: 'Strength' },
  { id: 'c22', time: '12:00', day: 3, coach: 'Andrés L.', spots: 14, taken: 4, wod: 'Strength · Back Squat', kind: 'Strength' },
  { id: 'c23', time: '17:00', day: 3, coach: 'Mateo A.', spots: 14, taken: 11, wod: 'Strength · Back Squat', kind: 'Strength' },
  { id: 'c24', time: '18:00', day: 3, coach: 'Renata P.', spots: 14, taken: 14, wod: 'Strength · Back Squat', kind: 'Strength' },
];

const DAYS = [
  { label: 'VIE', date: 2, full: 'Viernes 2 mayo' },
  { label: 'SÁB', date: 3, full: 'Sábado 3 mayo' },
  { label: 'DOM', date: 4, full: 'Domingo 4 mayo' },
  { label: 'LUN', date: 5, full: 'Lunes 5 mayo' },
  { label: 'MAR', date: 6, full: 'Martes 6 mayo' },
  { label: 'MIÉ', date: 7, full: 'Miércoles 7 mayo' },
  { label: 'JUE', date: 8, full: 'Jueves 8 mayo' },
];

const PRS = [
  { mov: 'Back Squat', value: '142.5', unit: 'kg', date: '18 ABR 2026', delta: '+5.0', cat: 'Levantamiento' },
  { mov: 'Clean & Jerk', value: '95', unit: 'kg', date: '02 MAR 2026', delta: '+2.5', cat: 'Olímpico' },
  { mov: 'Snatch', value: '72.5', unit: 'kg', date: '14 FEB 2026', delta: '+2.5', cat: 'Olímpico' },
  { mov: 'Deadlift', value: '180', unit: 'kg', date: '08 ENE 2026', delta: '+10', cat: 'Levantamiento' },
  { mov: 'Strict Press', value: '60', unit: 'kg', date: '22 DIC 2025', delta: '+2.5', cat: 'Levantamiento' },
  { mov: 'Fran', value: '6:42', unit: '', date: '12 NOV 2025', delta: '−0:36', cat: 'Benchmark', neg: true },
  { mov: 'Helen', value: '9:51', unit: '', date: '04 OCT 2025', delta: '−0:24', cat: 'Benchmark', neg: true },
  { mov: 'Murph', value: '42:18', unit: '', date: '26 MAY 2025', delta: '−2:11', cat: 'Hero', neg: true },
];

// Back Squat progression (kg) — used in the chart
const PR_TIMELINE = [
  { d: '2024 · MAR', v: 110 },
  { d: '2024 · JUN', v: 117.5 },
  { d: '2024 · OCT', v: 122.5 },
  { d: '2025 · ENE', v: 125 },
  { d: '2025 · MAY', v: 130 },
  { d: '2025 · AGO', v: 132.5 },
  { d: '2025 · NOV', v: 137.5 },
  { d: '2026 · ABR', v: 142.5 },
];

const ATTENDANCE_30 = [
  1,1,0,1,1,1,0,
  1,1,1,0,1,1,0,
  1,0,1,1,1,1,0,
  1,1,1,0,1,1,0,
  1,1,
];

Object.assign(window, {
  KGlyph, Wordmark, Icon, StatusBar, Phone, TabBar,
  ATHLETES, WOD_TODAY, SCHEDULE, DAYS, PRS, PR_TIMELINE, ATTENDANCE_30,
});
