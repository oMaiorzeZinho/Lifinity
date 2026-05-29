/* Lifinity — ícones de UI (traço arredondado, estilo clay-friendly)
   Glifos funcionais simples. Exporta para window. */

function Icon({ d, size = 24, stroke = 'currentColor', sw = 2.2, fill = 'none', children, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={style}>
      {d ? <path d={d} /> : children}
    </svg>
  );
}

const IcTasks   = (p) => <Icon {...p}><path d="M4 6.5h11M4 12h11M4 17.5h7"/><path d="M18.5 16l1.8 1.8L23 14.5" stroke={p.accent || 'currentColor'}/></Icon>;
const IcTrophy  = (p) => <Icon {...p}><path d="M7 4h10v3a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5C3 9 5 10 7 10M17 5h2.5A1.5 1.5 0 0 1 21 6.5C21 9 19 10 17 10M9.5 12.5 9 16h6l-.5-3.5M7.5 20h9M10 16v4M14 16v4"/></Icon>;
const IcSpark   = (p) => <Icon {...p}><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3Z"/></Icon>;
const IcUser    = (p) => <Icon {...p}><circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3.1-5.6 7-5.6s7 2 7 5.6"/></Icon>;
const IcPlus    = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IcBell    = (p) => <Icon {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 1.5 6 1.5 6h-15S6 14 6 9Z"/><path d="M10 19a2 2 0 0 0 4 0"/></Icon>;
const IcSearch  = (p) => <Icon {...p}><circle cx="11" cy="11" r="6.5"/><path d="m20 20-3.5-3.5"/></Icon>;
const IcCheck   = (p) => <Icon {...p}><path d="M5 12.5 10 17.5 19.5 7"/></Icon>;
const IcTrash   = (p) => <Icon {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6"/></Icon>;
const IcClock   = (p) => <Icon {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></Icon>;
const IcFlag    = (p) => <Icon {...p}><path d="M6 21V4M6 4h11l-2 3.5L17 11H6"/></Icon>;
const IcLock    = (p) => <Icon {...p}><rect x="5" y="10.5" width="14" height="9" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></Icon>;
const IcChevD   = (p) => <Icon {...p}><path d="m6 9 6 6 6-6"/></Icon>;
const IcChevR   = (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>;
const IcHeart   = (p) => <Icon {...p}><path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7-2.5C19 10.5 12 20 12 20Z"/></Icon>;
const IcHeartF  = (p) => <Icon {...p} fill="currentColor" sw={0}><path d="M12 20s-7-4.5-7-9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 7-2.5C19 10.5 12 20 12 20Z"/></Icon>;
const IcShuffle = (p) => <Icon {...p}><path d="M4 6h3.5l9 12H20M4 18h3.5l3-4M16.5 6H20m0 0-2.2-2.2M20 6l-2.2 2.2M20 18l-2.2-2.2M20 18l-2.2 2.2"/></Icon>;
const IcCopy    = (p) => <Icon {...p}><rect x="8" y="8" width="11" height="11" rx="2.5"/><path d="M5 15.5V6a2 2 0 0 1 2-2h8"/></Icon>;
const IcGear    = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.5 5.5 16.4 7.6M7.6 16.4l-2.1 2.1M18.5 18.5l-2.1-2.1M7.6 7.6 5.5 5.5"/></Icon>;
const IcLogout  = (p) => <Icon {...p}><path d="M15 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h9M14 12h7m0 0-3-3m3 3-3 3"/></Icon>;
const IcFire    = (p) => <Icon {...p}><path d="M12 3c.5 3-2.5 4-2.5 7A2.5 2.5 0 0 0 12 12.5c0-1 .8-1.6.8-1.6.6 1 2.2 2.3 2.2 4.6A3 3 0 0 1 12 18.5 4.5 4.5 0 0 1 7.5 14C7.5 8.5 12 7 12 3Z"/></Icon>;
const IcUsers   = (p) => <Icon {...p}><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.7-4.6 6-4.6s6 1.6 6 4.6M16 5.2A3 3 0 0 1 16 11M21 19c0-2.4-1.6-3.9-3.8-4.4"/></Icon>;
const IcChart   = (p) => <Icon {...p}><path d="M5 19V5M5 19h14M9 16v-4M13 16V9M17 16v-6"/></Icon>;
const IcInfinity= (p) => <Icon {...p} sw={p.sw || 2.4}><path d="M8 12c0-2 1.4-3.2 3-3.2S14 10.6 16 12s2.4 3.2 4 3.2S22 14 22 12s-1.4-3.2-3-3.2S16.6 10 16 12M8 12c0 2-1.4 3.2-3 3.2S2 14 2 12s1.4-3.2 3-3.2S6.6 10 8 12"/></Icon>;

Object.assign(window, {
  Icon,
  IcTasks, IcTrophy, IcSpark, IcUser, IcPlus, IcBell, IcSearch, IcCheck, IcTrash,
  IcClock, IcFlag, IcLock, IcChevD, IcChevR, IcHeart, IcHeartF, IcShuffle, IcCopy,
  IcGear, IcLogout, IcFire, IcUsers, IcChart, IcInfinity,
});
