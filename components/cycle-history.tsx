import { type Diary, intervals, isEligible, observation } from '@/lib/diary';
import { d } from '@/lib/daily-strings';
import { s, formatDate } from '@/lib/strings';
export function CycleHistory({diary,onConfirm,onAdd,disabled=false}:{diary:Diary;onConfirm:(value:Diary['confirmation'])=>void;onAdd:()=>void;disabled?:boolean}) {
 const cycles=intervals(diary.periods),latest=cycles.slice(-3).map(i=>i.days);
 const trigger=observation(diary.periods,diary.eligibility);
 return <section className="cycle-section journal-card"><p className="eyebrow">{d.cycleHistory}</p><h2>Recorded cycle timeline</h2><p>{d.cycleIntro}</p>
 {trigger&&<section className="observation"><p className="eyebrow">{s.review}</p><h3>{s.prompt(latest)}</h3>{diary.confirmation==='complete'?<p className="confirmation" role="status">{s.confirmed(latest)}</p>:<><div className="observation-actions"><button className="primary" onClick={onAdd} disabled={disabled}>{s.addMissed}</button><button className="outline" onClick={()=>onConfirm('complete')} disabled={disabled}>{s.complete}</button><button className="text-button" onClick={()=>onConfirm('unsure')} disabled={disabled}>{s.unsure}</button></div></>}<p className="fine-print">{s.ruleNote}</p></section>}
 {diary.confirmation==='unsure'&&<p className="confirmation">{s.uncertain}</p>}
 {cycles.length?<ol className="compact-cycles">{cycles.map(c=><li key={c.end}><span>{formatDate(c.start)} <span aria-hidden="true">→</span> {formatDate(c.end)}<span className="interval-track" aria-hidden="true"><i style={{width:`${100*c.days/Math.max(...cycles.map(i=>i.days))}%`}}/></span></span><strong>{c.days} <small>{s.cycle}</small></strong></li>)}</ol>:<p className="empty-copy">{d.nextStart}</p>}
 {diary.periods.length>0&&<details className="all-starts"><summary>{s.dates}</summary><ul>{diary.periods.map(date=><li key={date}>{formatDate(date)}</li>)}</ul></details>}
 <p className="fine-print">{s.statuses[diary.confirmation]}</p><p className="fine-print">{isEligible(diary.eligibility)?s.eligible:s.ineligible}</p><p className="fine-print">{s.noPrompt}</p><p className="fine-print">{s.reviewPending} · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/" target="_blank" rel="noreferrer">{s.reference}</a></p>
 </section>;
}
