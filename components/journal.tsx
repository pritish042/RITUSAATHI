'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { type Diary, type Note, emptyDiary, seedDiary, todayISO, intervals, daysBetween, observation, isEligible, validateDate, setPeriods, splitInterval, midpoint } from '@/lib/diary';
import { loadDiary, saveDiary, resetExample, deletePersonalDiary } from '@/lib/storage';
import { s, formatDate, formatMonthYear } from '@/lib/strings';

type Mode = 'personal'|'example';
type Editor = {kind:'period'|'note'; original?:string; date:string; text:string};
function Mark({small=false}:{small?:boolean}) { return <svg className={small?'mark small':'mark'} viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 7C15 15 12 21 12 28a12 12 0 0 0 24 0C36 21 33 15 24 7Z" fill="currentColor"/><path d="M24 18c-4 5-6 8-6 11a6 6 0 0 0 6 6" stroke="#fffaf6" strokeWidth="2.2" strokeLinecap="round"/></svg>; }
function Arrow(){return <span aria-hidden="true">↗</span>;}
export default function Journal({initialMode=null,initialView='diary'}:{initialMode?:Mode|null;initialView?:'diary'|'summary'}){
 const router=useRouter(), mode=initialMode, view=initialView;
 const setMode=(next:Mode|null)=>router.push(next==='personal'?'/diary':next==='example'?'/example':'/');
 const setView=(next:'diary'|'summary')=>router.push(`${mode==='example'?'/example':'/diary'}${next==='summary'?'/summary':''}`);
 const [today,setToday]=useState('');
 const [correction,setCorrection]=useState<({added:string}&NonNullable<ReturnType<typeof splitInterval>>)|null>(null);
 const [highlight,setHighlight]=useState(false);
 const correctionRef=useRef<HTMLLIElement|null>(null);
 const [data,setData]=useState<Diary>(emptyDiary), [ready,setReady]=useState(false), [storageError,setStorageError]=useState('');
 const [editor,setEditor]=useState<Editor|null>(null), [error,setError]=useState(''), [notice,setNotice]=useState('');
 const [confirm,setConfirm]=useState<'delete'|'reset'|null>(null);
 const returnFocus=useRef<HTMLElement|null>(null), dialogRef=useRef<HTMLDialogElement>(null), confirmationRef=useRef<HTMLDialogElement>(null);
 const cycles=intervals(data.periods), trigger=observation(data.periods,data.eligibility);
 const latest=cycles.slice(-3).map(i=>i.days);
 const locked=storageError===s.loadError;
 useEffect(()=>{ window.scrollTo(0,0); },[mode,view]);
 function openEditor(next:Editor){ returnFocus.current=document.activeElement as HTMLElement;setError('');setEditor(next); }
 useEffect(()=>{ if(editor) dialogRef.current?.showModal(); },[editor]);
 useEffect(()=>{ if(confirm) confirmationRef.current?.showModal(); },[confirm]);
 function closeEditor(){setEditor(null);setError('');if(returnFocus.current?.isConnected)returnFocus.current.focus();}
 useEffect(()=>{if(!correction)return;correctionRef.current?.focus({preventScroll:true});correctionRef.current?.scrollIntoView({block:'nearest',behavior:'instant'});const timer=setTimeout(()=>setHighlight(false),2400);return()=>clearTimeout(timer);},[correction]);
 function selectMode(next:Mode){setMode(next);}
 useEffect(()=>{
  let active=true;
  // No storage access during SSR, and no persistence effect tied to empty initial state.
  queueMicrotask(()=>{
   if(!active)return;
   const currentToday=todayISO();setToday(currentToday);
   if(mode){
    try{const loaded=loadDiary(localStorage,mode,currentToday);setData(loaded);setStorageError('');
     // Only persist an initialized example after successfully reading its own key.
     if(mode==='example')try{saveDiary(localStorage,mode,loaded);}catch{setStorageError(s.storageError);}
    }catch{setStorageError(s.loadError);}
   }
   setReady(true);
  });
  return()=>{active=false;};
 },[mode]);
 function update(next:Diary){
  if(locked)return;
  setData(next);
  if(mode)try{saveDiary(localStorage,mode,next);setStorageError('');}catch{setStorageError(s.storageError);}
 }
 function save(e:React.FormEvent){
  e.preventDefault();if(!editor)return;
  const issue=validateDate(editor.date,today);if(issue){setError(s[issue]);return;}
  if(editor.kind==='period'){
   if(data.periods.some(d=>d===editor.date && d!==editor.original)){setError(s.duplicate);return;}
   const next=setPeriods(data,[...data.periods.filter(d=>d!==editor.original),editor.date]);
   const split=!editor.original?splitInterval(data.periods,editor.date):null;
   if(split){setCorrection({...split,added:editor.date});setHighlight(true);}else{setCorrection(null);}
   update(next);setNotice(split?`${s.split(split.days,split.first,split.second)} ${s.updated(intervals(next.periods).map(i=>i.days))}`:editor.original?s.edited:s.added);
  } else {
   if(!editor.text.trim()){setError(s.requiredNote);return;}
   const note:Note={id:editor.original??crypto.randomUUID(),date:editor.date,text:editor.text.trim()};
   update({...data,notes:[...data.notes.filter(n=>n.id!==editor.original),note]});setNotice(s.noteSaved);
  }
  closeEditor();
 }
 function removePeriod(date:string){update(setPeriods(data,data.periods.filter(d=>d!==date)));setNotice(s.removed);}
 function resetOrDelete(){
  const next=confirm==='reset'?seedDiary(today):emptyDiary();
  try{if(mode){if(confirm==='reset')resetExample(localStorage,today);else deletePersonalDiary(localStorage);}}catch{setStorageError(s.storageError);setConfirm(null);return;}
  setStorageError('');setData(next);setNotice('');setCorrection(null);setConfirm(null);if(mode==='personal'){setMode(null);setReady(false);}
 }
 const newPeriod=()=>openEditor({kind:'period',date:'',text:''});
 const newNote=()=>openEditor({kind:'note',date:today,text:''});
 const entries=[...data.periods.map(date=>({kind:'period' as const,date,id:date,text:''})),...data.notes.map(n=>({...n,kind:'note' as const}))].sort((a,b)=>a.date.localeCompare(b.date)||a.kind.localeCompare(b.kind));
 return <>
 <header className="site-header no-print"><button className="brand" onClick={()=>{setMode(null);setReady(false);}} aria-label={`${s.name} ${s.home}`}><Mark small/>{s.name}<span className="brand-dot">.</span></button><div className="header-right"><span className="private-label"><span className="privacy-dot"/>{s.local}</span>{mode&&<button className="text-button" onClick={()=>setView(view==='diary'?'summary':'diary')}>{view==='diary'?s.summary:s.back} <Arrow/></button>}</div></header>
 {!mode?<main className="landing">
  <section className="hero"><div className="hero-copy"><p className="eyebrow">{s.journalLabel}</p><h1>{s.name}<span className="masthead-period">.</span></h1><p className="hero-tagline">{s.tagline}</p><p className="hero-description">{s.heroText}</p><div className="hero-actions"><button className="primary" onClick={()=>selectMode('personal')}>{s.start} <Arrow/></button><button className="secondary" onClick={()=>selectMode('example')}>{s.explore} <span aria-hidden="true">→</span></button></div><p className="home-private">{s.local} · {s.noAccount}</p></div>
  <section className="preview" aria-label={s.previewTitle}><div className="preview-heading"><span className="eyebrow">{s.previewTitle}</span><span className="example-badge">{s.example}</span></div><h2>{s.previewHeading}</h2>{today?<ol className="preview-timeline">{seedDiary(today).periods.map((date,i)=>{const cycle=intervals(seedDiary(today).periods)[i-1];return <li key={date}>{cycle&&<div className="preview-interval"><strong>{cycle.days}</strong><span>{s.daysBetween}</span></div>}<div className="preview-entry"><span className="preview-tick" aria-hidden="true"/><time dateTime={date}><strong>{date.slice(8)}</strong><span>{formatMonthYear(date)}</span></time><span>{s.periodStart}</span></div></li>;})}</ol>:<p className="preview-loading">{s.loading}</p>}<p className="preview-footnote">{s.previewFootnote}</p></section></section>
  <section className="privacy-banner"><span className="privacy-symbol" aria-hidden="true">⌑</span><div><h3>{s.privacyTitle}</h3><p>{s.privacy}</p></div></section>
 </main>:!ready?<main>{s.loading}</main>:<main className={`workspace ${view==='summary'?'summary-view':''}`}>
  <div className="workspace-top"><div className="breadcrumbs no-print"><button onClick={()=>{setMode(null);setReady(false);}}>{s.home}</button><span>/</span><span>{mode==='example'?s.example:s.diary}</span>{view==='summary'&&<><span>/</span><span>{s.summary}</span></>}</div>{mode==='example'&&<span className="example-badge">✳ {s.example}</span>}</div>
  {storageError&&<p className="error-banner" role="alert">{storageError}</p>}
  {view==='diary'?<>
   <section className="diary-heading"><div><p className="eyebrow">{mode==='example'?s.example:s.diary}</p><h1>{s.welcome}</h1><p>{mode==='example'?s.exampleIntro:s.intro}</p></div><div className="log-actions"><button className="primary" onClick={newPeriod} disabled={locked}>＋ {s.logPeriod}</button><button className="secondary" onClick={newNote} disabled={locked}>＋ {s.logSymptom}</button></div></section>
   <div className={notice?"notice":"sr-only"} role="status" aria-live="polite" aria-atomic="true">{notice&&<><span aria-hidden="true">↳</span><p>{notice}</p></>}</div>
   <div className="diary-grid"><div className="history-column">
    {trigger&&<section className="observation"><div className="observation-title"><span aria-hidden="true">✳</span><p className="eyebrow">{s.review}</p></div><h2>{s.prompt(latest)}</h2>{data.confirmation==='complete'?<p className="confirmation" role="status">{s.confirmed(latest)}</p>:<><div className="observation-actions"><button className="primary" onClick={newPeriod} disabled={locked}>{s.addMissed} <span aria-hidden="true">＋</span></button><button className="outline" onClick={()=>update({...data,confirmation:'complete'})} disabled={locked}>{s.complete}</button><button className="text-button" onClick={()=>update({...data,confirmation:'unsure'})} disabled={locked}>{s.unsure}</button></div>{data.confirmation==='unsure'&&<p className="confirmation" role="status">{s.uncertain}</p>}</>}<p className="fine-print">{s.ruleNote}</p></section>}
    {!trigger&&data.confirmation==='unsure'&&<p className="notice">{s.uncertain}</p>}
    <section className="timeline-panel"><div className="panel-heading"><div><h2>{s.timeline}</h2><p>{s.timelineHint}</p></div><span className="timeline-key"><span aria-hidden="true">●</span> {s.periodStart} / <span aria-hidden="true">◇</span> {s.symptomNote}</span></div>
    {entries.length===0?<div className="empty"><Mark/><h3>{s.emptyTitle}</h3><p>{s.emptyText}</p><button className="outline" onClick={newPeriod} disabled={locked}>{s.logPeriod}</button></div>:<ol className="timeline">{entries.map(entry=>{const interval=entry.kind==='period'?cycles.find(c=>c.end===entry.date):null;return <li key={`${entry.kind}-${entry.id}`} className={`${entry.kind}${highlight&&correction&&(entry.date===correction.added||entry.date===correction.end)?' corrected':''}${data.confirmation==='complete'?' confirmed-entry':''}`} ref={entry.date===correction?.added&&entry.kind==='period'?correctionRef:undefined} tabIndex={entry.date===correction?.added&&entry.kind==='period'?-1:undefined}>{interval&&<div className="interval"><strong>{interval.days}</strong><span>{s.daysBetween}<small>{formatDate(interval.start)} → {formatDate(interval.end)}</small></span>{correction&&entry.date===correction.added&&<span className="correction-label">{s.addedDate}</span>}</div>}<div className="timeline-event"><span className="event-dot" aria-hidden="true">{entry.kind==='period'?'●':'✧'}</span><div className="event-body"><time dateTime={entry.date}><strong>{entry.date.slice(8)}</strong><span>{formatMonthYear(entry.date)}</span></time><h3>{entry.kind==='period'?s.periodStart:s.symptomNote}</h3>{entry.kind==='note'&&<p>{entry.text}</p>}</div><div className="event-actions"><button onClick={()=>openEditor({kind:entry.kind,original:entry.id,date:entry.date,text:entry.text})} disabled={locked} aria-label={`${s.edit} ${entry.kind==='period'?s.periodStart:s.symptomNote} ${formatDate(entry.date)}`}>{s.edit}</button><button onClick={()=>entry.kind==='period'?removePeriod(entry.date):(update({...data,notes:data.notes.filter(n=>n.id!==entry.id)}),setNotice(s.noteRemoved))} disabled={locked} aria-label={`${s.delete} ${entry.kind==='period'?s.periodStart:s.symptomNote} ${formatDate(entry.date)}`}>{s.delete}</button></div></div></li>;})}</ol>}
    {data.periods.length<2&&<p className="timeline-footnote">{s.firstInterval}</p>}{data.periods.length>0&&<p className="elapsed-note">{daysBetween(data.periods.at(-1)!,today)} {s.since.toLowerCase()} · {s.elapsed}</p>}
    </section>
    {!trigger&&<p className="quiet-note">{s.noPrompt}</p>}
   </div><aside className="sidebar">
    <section className="summary-card"><span className="card-icon" aria-hidden="true">▤</span><h2>{s.summary}</h2><p>{s.summaryIntro}</p><button className="outline" onClick={()=>setView('summary')}>{s.summary} <Arrow/></button></section>
    <section className="context-card"><details><summary>{s.profile}<span aria-hidden="true">＋</span></summary><p>{s.profileHint}</p>{s.profileQuestions.map(([key,label])=><fieldset key={key} disabled={locked}><legend>{label}</legend><div className="answer-options">{(['yes','no','unsure'] as const).map(value=><label key={value}><input type="radio" name={key} value={value} checked={data.eligibility[key]===value} onChange={()=>update({...data,eligibility:{...data.eligibility,[key]:value}})}/>{value==='yes'?s.yes:value==='no'?s.no:s.unknown}</label>)}</div></fieldset>)}<button className="text-button" disabled={locked} onClick={()=>update({...data,eligibility:emptyDiary().eligibility})}>{s.skip}</button></details><p className="fine-print">{isEligible(data.eligibility)?s.eligible:s.ineligible}</p>{mode==='example'&&<p className="fine-print">{s.demoProfile}</p>}</section>
    {mode==='example'&&<section className="demo-card"><p className="eyebrow">{s.midpointLabel}</p>{midpoint(data.periods)&&<p>{s.midpoint(formatDate(midpoint(data.periods)!))}</p>}<button className="text-button" onClick={()=>setConfirm('reset')}>{s.reset} <span aria-hidden="true">↻</span></button></section>}
    <section className="scope-card"><h3>{s.scope}</h3><p>{s.scopeText}</p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/" target="_blank" rel="noreferrer">{s.reference} ↗</a><small>{s.reviewPending}</small></section>
   </aside></div>
   <section className="privacy-banner diary-privacy"><div><h3>{s.privacyTitle}</h3><p>{s.privacy}</p></div>{mode==='personal'&&<button className="danger text-button" onClick={()=>setConfirm('delete')}>{s.deleteDiary}</button>}</section>
  </>:<>
   <section className="summary-heading"><p className="eyebrow">{s.summary}</p><h1>{s.summaryTitle}</h1><p>{s.summaryIntro}</p><button className="primary no-print" onClick={()=>window.print()}>{s.print} <span aria-hidden="true">↗</span></button></section>
   <article className="print-sheet"><div className="print-sheet-brand"><Mark small/><strong>{s.name}</strong><span>{formatDate(today)}</span></div>{mode==='example'&&<p className="example-badge">{s.example}</p>}<section><h2>{s.status}</h2><p>{s.statuses[data.confirmation]}</p></section><div className="summary-columns"><section><h2>{s.dates}</h2>{data.periods.length?<ol>{data.periods.map(date=><li key={date}>{formatDate(date)}</li>)}</ol>:<p>{s.none}</p>}</section><section><h2>{s.intervals}</h2>{cycles.length?<ol>{cycles.map(i=><li key={i.start}><strong>{i.days} {s.cycle}</strong><span className="date-range">{formatDate(i.start)} → {formatDate(i.end)}</span></li>)}</ol>:<p>{s.noIntervals} {s.firstInterval}</p>}{data.periods.length>0&&<p className="fine-print">{daysBetween(data.periods.at(-1)!,today)} {s.since.toLowerCase()}. {s.elapsed}.</p>}</section></div><section><h2>{s.notes}</h2>{data.notes.length?<ul>{[...data.notes].sort((a,b)=>a.date.localeCompare(b.date)).map(n=><li key={n.id}><strong>{formatDate(n.date)}</strong><p className="preserve">{n.text}</p></li>)}</ul>:<p>{s.none}</p>}</section><section><h2>{s.questions}</h2><label className="sr-only" htmlFor="visit-questions">{s.questions}</label><textarea className="no-print" id="visit-questions" placeholder={s.questionsPlaceholder} value={data.questions} disabled={locked} onChange={e=>update({...data,questions:e.target.value})}/><p className="print-only preserve">{data.questions||s.questionsEmpty}</p></section><section><h2>{s.profileSummary}</h2><ul className="profile-summary">{s.profileQuestions.map(([key,label])=><li key={key}>{label} <strong>{data.eligibility[key]==='yes'?s.yes:data.eligibility[key]==='no'?s.no:s.unknown}</strong></li>)}</ul></section><section><h2>{s.context}</h2><p>{trigger?(data.confirmation==='complete'?s.confirmed(latest):s.prompt(latest)):s.noPrompt}</p><p>{isEligible(data.eligibility)?s.eligible:s.ineligible}</p><p>{s.ruleNote}</p><p>{s.scopeText}</p><p className="fine-print">{s.reviewPending}. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/">{s.reference}</a></p></section></article>
  </>}
 </main>}
 <footer className="site-footer no-print"><div><Mark small/><span>{s.name}</span><span className="footer-tagline">{s.footer}</span></div><span>{s.reviewPending}</span></footer>
 {editor&&<dialog ref={dialogRef} onCancel={closeEditor} onClick={e=>{if(e.target===e.currentTarget)closeEditor();}}><form onSubmit={save} noValidate><p className="eyebrow">{mode==='example'?s.example:s.diary}</p><h2>{editor.kind==='period'?(editor.original?s.periodEdit:s.periodTitle):(editor.original?s.noteEdit:s.noteTitle)}</h2><label htmlFor="entry-date">{s.date}</label><input id="entry-date" type="date" value={editor.date} min="0001-01-01" max={today} onChange={e=>setEditor({...editor,date:e.target.value})} aria-describedby={error?'entry-error':undefined} autoFocus/>{editor.kind==='note'?<><label htmlFor="entry-note">{s.note}</label><textarea id="entry-note" value={editor.text} placeholder={s.notePlaceholder} onChange={e=>setEditor({...editor,text:e.target.value})}/></>:<p className="fine-print">{s.optional}</p>}{error&&<p id="entry-error" className="field-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="secondary" onClick={closeEditor}>{s.cancel}</button><button type="submit" className="primary">{s.save}</button></div></form></dialog>}
 {confirm&&<dialog ref={confirmationRef} onCancel={()=>setConfirm(null)}><h2>{confirm==='delete'?s.deleteTitle:s.resetTitle}</h2><p>{confirm==='delete'?s.deleteText:s.resetText}</p><div className="dialog-actions"><button className="secondary" onClick={()=>setConfirm(null)}>{s.cancel}</button><button className="primary" onClick={resetOrDelete}>{confirm==='delete'?s.deleteConfirm:s.resetConfirm}</button></div></dialog>}
 </>;
}
