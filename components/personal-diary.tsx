'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { daysBetween, intervals, splitInterval, observation } from '@/lib/diary';
import { deletePersonalDiary } from '@/lib/storage';
import { dayAt, hasObservation, loggedDates, putDay, removeDay, summaryRecords, type Day } from '@/lib/daily';
import { d } from '@/lib/daily-strings';
import { s, formatDate, formatMonthYear } from '@/lib/strings';
import { useDiary } from './use-diary';
import { DiaryShell, type DiaryView } from './diary-shell';
import { CheckIn } from './check-in';
import { DayDetails, DayMarkers, dayLabel } from './day-details';
import { CycleHistory } from './cycle-history';
import { VisitSummary } from './visit-summary';
import { DiarySettings } from './diary-settings';
import { DiaryCalendar } from './diary-calendar';
import { Icon } from './diary-icons';

export default function PersonalDiary({view='today',example=false}:{view?:DiaryView;example?:boolean}) {
 const diary=useDiary(example?'example':'personal');
 const {data,today,ready,unreadable,commit}=diary;
 const [editor,setEditor]=useState<string|null>(null),[selected,setSelected]=useState(''),[month,setMonth]=useState(''),[historyView,setHistoryView]=useState<'calendar'|'list'>('calendar');
 const [notice,setNotice]=useState(''),[savedDate,setSavedDate]=useState(''),[highlight,setHighlight]=useState(''),[deleteDate,setDeleteDate]=useState<string|null>(null);
 const triggerRef=useRef<HTMLElement|null>(null),savedRef=useRef<HTMLElement|null>(null),deleteDialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(deleteDate)deleteDialog.current?.showModal();},[deleteDate]);
 useEffect(()=>{if(!highlight)return;const timer=setTimeout(()=>setHighlight(''),2200);return()=>clearTimeout(timer);},[highlight]);
 useEffect(()=>{if(!savedDate||editor!==null)return;savedRef.current?.focus({preventScroll:true});},[savedDate,notice,editor]);
 function open(date:string){triggerRef.current=document.activeElement as HTMLElement;setEditor(date);}
 function close(){setEditor(null);queueMicrotask(()=>triggerRef.current?.isConnected&&triggerRef.current.focus());}
 function save(day:Day):boolean {
  const next=putDay(data,day,today);
  if(!commit(next))return false;
  const split=!data.periods.includes(day.date)&&day.periodStart?splitInterval(data.periods,day.date):null;
  const startsChanged=data.periods.includes(day.date)!==day.periodStart;
  setNotice(split?`${d.saved} ${s.split(split.days,split.first,split.second)} ${s.updated(intervals(next.periods).map(i=>i.days))}`:`${d.saved}${startsChanged?' '+d.intervalChanged:''}`);
  setSelected(day.date);setMonth(day.date.slice(0,7));setSavedDate(day.date);setHighlight(day.date);setEditor(null);return true;
 }
 function deleteSelected(){if(deleteDate&&commit(removeDay(data,deleteDate))){setNotice(d.deleted);setSavedDate('');setDeleteDate(null);}else setNotice(d.saveFailed);}
 const currentMonth=month||today.slice(0,7),currentDate=selected||today;
 const dates=loggedDates(data),lastStart=data.periods.at(-1);
 const cycles=intervals(data.periods),recent=dates.slice(-4).reverse(),coverage=today?summaryRecords(data,today,'90',true):null;
 const todayDay=dayAt(data,today),todayLogged=hasObservation(todayDay);
 return <DiaryShell view={view} example={example}><main id="diary-main" className={`daily-workspace ${view==='summary'?'summary-view':''}`}>
 {!ready?<p className="loading-state">{s.loading}</p>:<>
 {example&&<p className="example-badge">{s.example}</p>}
 {unreadable&&<p className="error-banner" role="alert">{d.loadFailed} <Link href="/diary/settings">{d.settings}</Link></p>}
 <div className={notice?'notice no-print':'sr-only'} role="status" aria-live="polite" aria-atomic="true">{notice}</div>
 {view==='today'&&<>
 <div className="workspace-meta"><span className="local-badge"><i/>Only in this browser</span><span>Your personal health journal</span></div>
 <section className="today-hero"><div className="hero-greeting"><p className="hero-date"><Icon name="calendar" size={18}/>{new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${today}T00:00:00Z`))}</p><h1>How are you feeling<br className="desktop-break"/> today?</h1><p>Your body, your rhythm, recorded in your own words.</p><div className="hero-buttons"><button className="primary" disabled={unreadable} onClick={()=>open(today)}><Icon name={todayLogged?'check':'plus'}/>{todayLogged?d.editToday:d.logToday}</button><button className="hero-secondary" disabled={unreadable} onClick={()=>open(currentDate)}>{d.logDate}<Icon name="arrow" size={17}/></button></div></div>
 <aside className="cycle-overview"><span className="pill">Cycle overview</span><p className="eyebrow">Last recorded period start</p>{lastStart?<><h2>{formatDate(lastStart)}</h2><p className="elapsed-stat"><strong>{daysBetween(lastStart,today)}</strong><span>{daysBetween(lastStart,today)===1?'day':'days'} since the recorded start</span></p><p className="hero-fine">Elapsed time, not a completed cycle.</p></>:<><h2>A little history starts here.</h2><p>Record a period start to begin your cycle timeline.</p></>}<div className="cycle-overview-footer"><span>{cycles.length} completed {cycles.length===1?'interval':'intervals'}</span><Link href="/diary/history">View history <Icon name="arrow" size={16}/></Link></div></aside></section>
 {observation(data.periods,data.eligibility)&&<section className="pattern-card journal-card"><span className="round-icon"><Icon name="leaf"/></span><div><h2>A moment to check your dates</h2><p>{s.prompt(cycles.slice(-3).map(i=>i.days))}</p></div><Link href="/diary/history" className="text-button">Review dates <Icon name="arrow"/></Link></section>}
 <div className="dashboard-grid"><div className="dashboard-stream"><section className={`today-entry journal-card ${highlight===today?'just-saved':''}`}><div className="card-heading"><span className="round-icon"><Icon name={todayLogged?'check':'sun'}/></span><div><p className="eyebrow">{d.today}</p><h2>Today’s check-in</h2></div><span className="pill">{todayLogged?'Recorded':'A moment for you'}</span></div>{todayLogged?<><DayDetails day={todayDay}/><div className="entry-utilities"><button className="text-button" disabled={unreadable} onClick={()=>open(today)}>Edit entry <Icon name="arrow" size={16}/></button><button className="text-button danger" disabled={unreadable} onClick={()=>setDeleteDate(today)}>{d.deleteDay}</button></div></>:<div className="empty-journal"><Icon name="leaf" size={32}/><h3>Make a little space for yourself.</h3><p>Nothing recorded for today yet. A symptom, a note, or a period start is enough. Every field is optional.</p></div>}</section>
 <section className="recent-entries journal-card"><div className="section-heading"><div><p className="eyebrow">From your journal</p><h2>Recent entries</h2></div><Link href="/diary/history">All entries <Icon name="arrow" size={16}/></Link></div>{recent.length?<ol>{recent.map(date=><li key={date}><button onClick={()=>open(date)} disabled={unreadable}><span className="entry-date"><strong>{date.slice(8)}</strong><span>{formatMonthYear(date)}</span></span><span className="entry-description">{dayAt(data,date).periodStart?'Period started':dayAt(data,date).note||dayAt(data,date).legacyNotes[0]?.text||dayAt(data,date).symptoms.join(', ')||'Daily observation'}<small>{[dayAt(data,date).flow?`${d.flows[dayAt(data,date).flow!]} flow`:'',dayAt(data,date).cramps?`${d.crampLevels[dayAt(data,date).cramps!]} cramps`:''].filter(Boolean).join(' · ')}</small></span><Icon name="arrow" size={18}/></button></li>)}</ol>:<p className="empty-copy">Your entries will gather here as you log. You can also record an earlier date.</p>}</section></div>
 <aside className="dashboard-aside"><DiaryCalendar diary={data} today={today} month={currentMonth} selected={currentDate} onMonth={setMonth} onSelect={setSelected} compact/>{currentDate!==today&&<section className="journal-card"><p className="eyebrow">Selected day</p><h2 className="selected-preview-date">{formatDate(currentDate)}</h2><DayDetails day={dayAt(data,currentDate)}/><button className="text-button" disabled={unreadable} onClick={()=>open(currentDate)}>{hasObservation(dayAt(data,currentDate))?d.editDay:d.checkIn} <Icon name="arrow" size={16}/></button></section>}
 <section className="visit-card"><Icon name="book" size={24}/><h2>A clearer conversation</h2><p>Keep your dates, observations, and questions together for your next appointment.</p><Link href="/diary/summary" className="text-button">Prepare a visit summary <Icon name="arrow" size={16}/></Link></section>
 {coverage&&<section className="logging-card"><p className="eyebrow">Logging completeness</p><p className="coverage-stat"><strong>{coverage.daysLogged}</strong> / {coverage.totalDays} days logged</p><p>{formatDate(coverage.from)} – {formatDate(coverage.to)}</p><p className="fine-print">Unlogged days are unknown.</p></section>}</aside></div>
 {savedDate&&savedDate!==today&&<section ref={savedRef} tabIndex={-1} className="saved-day"><p className="eyebrow">{d.saved}</p><h2>{formatDate(savedDate)}</h2><DayDetails day={dayAt(data,savedDate)}/><button className="text-button" onClick={()=>open(savedDate)}>{d.editDay}</button></section>}
 {savedDate===today&&<span ref={savedRef} tabIndex={-1} className="sr-only">{d.saved} {dayLabel(dayAt(data,today))}</span>}
 </>}
 {view==='history'&&<>
 <section className="daily-title history-title"><div><p className="eyebrow">{d.history}</p><h1>{d.historyTitle}</h1><p>{d.calendarIntro}</p></div></section>
 <div className="history-switch" role="group" aria-label={d.history}>{(['calendar','list'] as const).map(value=><button key={value} aria-pressed={historyView===value} onClick={()=>setHistoryView(value)}>{value==='calendar'?d.calendar:d.list}</button>)}</div>
 <div className="history-layout"><div>
 {historyView==='calendar'?<DiaryCalendar diary={data} today={today} month={currentMonth} selected={currentDate} onMonth={setMonth} onSelect={date=>{setSelected(date);setSavedDate('');}}/>:<section className="history-list" aria-label={d.list}>{dates.length?<ol>{[...dates].reverse().map(date=><li key={date} className={date===highlight?'just-saved':''}><button aria-pressed={date===currentDate} onClick={()=>{setSelected(date);setSavedDate('');}}><time dateTime={date}>{formatDate(date)}</time><DayMarkers day={dayAt(data,date)}/><span className="sr-only">{dayLabel(dayAt(data,date))}</span><span aria-hidden="true">→</span></button></li>)}</ol>:<p>{d.noRecords}</p>}</section>}
 </div><section key={currentDate} ref={savedRef} tabIndex={-1} className={`selected-day journal-card ${highlight===currentDate?'just-saved':''}`} aria-label={d.dayDetails}><p className="eyebrow">Journal inspector · {d.dayDetails}</p><h2>{formatDate(currentDate)}</h2><DayDetails day={dayAt(data,currentDate)}/><div className="day-actions"><button className="primary" disabled={unreadable} onClick={()=>open(currentDate)}>{hasObservation(dayAt(data,currentDate))?d.editDay:d.checkIn}</button>{hasObservation(dayAt(data,currentDate))&&<button className="text-button danger" disabled={unreadable} onClick={()=>setDeleteDate(currentDate)}>{d.deleteDay}</button>}</div></section></div>
 <CycleHistory diary={data} disabled={unreadable} onAdd={()=>open(currentDate)} onConfirm={confirmation=>setNotice(commit({...data,confirmation})?d.saved:d.saveFailed)}/>
 </>}
 {view==='summary'&&!unreadable&&<VisitSummary diary={data} today={today} example={example} disabled={unreadable} onSave={commit}/>}
 {view==='settings'&&<DiarySettings diary={data} today={today} unreadable={unreadable} onSave={commit} onClear={()=>{try{deletePersonalDiary(localStorage);}catch{return false;}window.location.reload();return true;}}/>}
 </>}
 </main>
 {editor&&<CheckIn diary={data} date={editor} today={today} onSave={save} onClose={close}/>}
 {deleteDate&&<dialog ref={deleteDialog} aria-labelledby="delete-day-title" onCancel={()=>setDeleteDate(null)}><h2 id="delete-day-title">{d.deleteTitle}</h2><p>{formatDate(deleteDate)}</p><p>{d.deleteBody}</p><div className="dialog-actions"><button className="secondary" onClick={()=>setDeleteDate(null)}>{d.cancel}</button><button className="primary" onClick={deleteSelected}>{d.deleteConfirm}</button></div></dialog>}
 </DiaryShell>;
}
