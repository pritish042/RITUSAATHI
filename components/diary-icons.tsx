import type { CSSProperties } from 'react';
export type IconName = 'leaf'|'calendar'|'book'|'plus'|'check'|'arrow'|'settings'|'close'|'print'|'sun';
const paths:Record<IconName,React.ReactNode>={
 leaf:<><path d="M19 4C9 3 3 8 6 15c5 5 13 0 13-11Z"/><path d="m4 21 11-11M9 16v-5m0 5h5"/></>,
 calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/></>,
 book:<><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/><path d="M5 8h4m-4 4h4m6-4h4m-4 4h4"/></>,
 plus:<path d="M12 5v14M5 12h14"/>,check:<path d="m5 12 4 4L19 6"/>,arrow:<path d="M5 12h14m-5-5 5 5-5 5"/>,
 settings:<><path d="m9 3-1 3-3 1v3l-2 2 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-2V7l-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/></>,
 close:<path d="m6 6 12 12M6 18 18 6"/>,print:<><path d="M6 9V3h12v6M6 17H3V9h18v8h-3M6 14h12v7H6Z"/><path d="M17 12h1"/></>,
 sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/></>
};
export function Icon({name,size=20,style}:{name:IconName;size?:number;style?:CSSProperties}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="diary-icon" style={style}>{paths[name]}</svg>;}
