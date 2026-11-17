import Link from 'next/link';
import { d } from '@/lib/daily-strings';
import { s } from '@/lib/strings';
import { Icon, type IconName } from './diary-icons';
export type DiaryView = 'today'|'history'|'summary'|'settings';
export function DiaryShell({view,example=false,children}:{view:DiaryView;example?:boolean;children:React.ReactNode}) {
 const items:[string,string,string,IconName][]=[['today','/diary','Today','sun'],['history','/diary/history','History','calendar'],['summary','/diary/summary','Summary','book']];
 return <><a className="skip-link" href="#diary-main">Skip to content</a><header className="site-header daily-header no-print"><Link href="/" className="brand"><span className="brand-emblem"><Icon name="leaf" size={30}/></span><span>{s.name}<small>Menstrual health diary</small></span></Link>{example?<Link className="text-button" href="/example">{s.back}</Link>:<><nav className="desktop-diary-nav" aria-label={s.diary}>{items.map(([name,href,label])=><Link key={name} href={href} aria-current={view===name?'page':undefined}>{label}</Link>)}</nav><Link className="settings-link" aria-label="Settings" href="/diary/settings" aria-current={view==='settings'?'page':undefined}><Icon name="settings"/><span>{d.settings}</span></Link></>}</header>{children}{!example&&<nav className="bottom-diary-nav no-print" aria-label={s.diary}>{items.map(([name,href,label,icon])=><Link key={name} href={href} aria-current={view===name?'page':undefined}><Icon name={icon}/>{label}</Link>)}</nav>}<footer className="site-footer no-print"><span><strong>{s.name}</strong> · A little clarity, one day at a time.</span><span>{s.local} · {s.reviewPending}</span></footer></>;
}
