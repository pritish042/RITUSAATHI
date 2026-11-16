'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { daysBetween, intervals, splitInterval } from '@/lib/diary';
import { deletePersonalDiary } from '@/lib/storage';
import { dayAt, hasObservation, loggedDates, monthCells, putDay, removeDay, shiftMonth, type Day } from '@/lib/daily';
import { d } from '@/lib/daily-strings';
import { s, formatDate, formatMonthYear } from '@/lib/strings';
import { useDiary } from './use-diary';
import { DiaryShell, type DiaryView } from './diary-shell';
import { CheckIn } from './check-in';
import { DayDetails, DayMarkers, dayLabel } from './day-details';
import { CycleHistory } from './cycle-history';
import { VisitSummary } from './visit-summary';
import { DiarySettings } from './diary-settings';

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
 return <DiaryShell view={view} example={example}><main className={`daily-workspace ${view==='summary'?'summary-view':''}`}>
 {!ready?<p className="loading-state">{s.loading}</p>:<>
 {example&&<p className="example-badge">{s.example}</p>}
 {unreadable&&<p className="error-banner" role="alert">{d.loadFailed} <Link href="/diary/settings">{d.settings}</Link></p>}
 <div className={notice?'notice no-print':'sr-only'} role="status" aria-live="polite" aria-atomic="true">{notice}</div>
 {view==='today'&&<>
 <section className="today-spread"><div className="today-date"><p className="eyebrow">{d.today}</p><time dateTime={today}><strong>{today.slice(8)}</strong><span>{formatMonthYear(today)}</span></time><h1>{d.todayHeading}</h1><button className="primary today-action" disabled={unreadable} onClick={()=>open(today)}>{hasObservation(dayAt(data,today))?d.editToday:d.logToday} <span aria-hidden="true">＋</span></button><button className="text-button" disabled={unreadable} onClick={()=>open(today)}>{d.logDate} ↗</button></div>
 <section className={`today-entry ${highlight===today?'just-saved':''}`}><p className="eyebrow">{s.diary}</p>{hasObservation(dayAt(data,today))?<><h2>{formatDate(today)}</h2><DayDetails day={dayAt(data,today)}/><button className="text-button danger" disabled={unreadable} onClick={()=>setDeleteDate(today)}>{d.deleteDay}</button></>:<><h2>{d.nothingToday}</h2><p>{d.noRecordsHint}</p></>}
 <div className="last-period"><p className="eyebrow">{d.lastStart}</p>{lastStart?<><p className="last-date">{formatDate(lastStart)}</p><p>{d.elapsedSince(daysBetween(lastStart,today))}</p></>:<p>{d.noStart}</p>}{data.periods.length<2&&<p>{d.nextStart}</p>}<Link className="text-button" href="/diary/history">{d.cycleHistory} ↗</Link></div></section></section>
 {savedDate&&savedDate!==today&&<section ref={savedRef} tabIndex={-1} className="saved-day"><p className="eyebrow">{d.saved}</p><h2>{formatDate(savedDate)}</h2><DayDetails day={dayAt(data,savedDate)}/><button className="text-button" onClick={()=>open(savedDate)}>{d.editDay}</button></section>}
 {savedDate===today&&<span ref={savedRef} tabIndex={-1} className="sr-only">{d.saved} {dayLabel(dayAt(data,today))}</span>}
 </>}
 {view==='history'&&<>
 <section className="daily-title history-title"><div><p className="eyebrow">{d.history}</p><h1>{d.historyTitle}</h1><p>{d.calendarIntro}</p></div><button className="primary" disabled={unreadable} onClick={()=>open(currentDate)}>{d.checkIn} ＋</button></section>
 <div className="history-switch" role="group" aria-label={d.history}>{(['calendar','list'] as const).map(value=><button key={value} aria-pressed={historyView===value} onClick={()=>setHistoryView(value)}>{value==='calendar'?d.calendar:d.list}</button>)}</div>
 <div className="history-layout"><div>
 {historyView==='calendar'?<section className="month-calendar" aria-label={d.calendar}><div className="month-controls"><h2 aria-live="polite">{formatMonthYear(`${currentMonth}-01`)}</h2><div><button aria-label={d.previous} onClick={()=>setMonth(shiftMonth(currentMonth,-1))}>←</button><button onClick={()=>{setMonth(today.slice(0,7));setSelected(today);}}>{d.today}</button><button aria-label={d.next} disabled={currentMonth>=today.slice(0,7)} onClick={()=>setMonth(shiftMonth(currentMonth,1))}>→</button></div></div>
 <div className="calendar-weekdays" aria-hidden="true">{d.weekdays.map(day=><span key={day}>{day}</span>)}</div><div className="calendar-grid">{monthCells(currentMonth).map((date,index)=>date?<button className={`${date===today?'is-today ':''}${date===currentDate?'is-selected ':''}${date===highlight?'just-saved':''}`} key={date} disabled={date>today} aria-label={dayLabel(dayAt(data,date))+(date===today?`, ${d.today}`:'')} aria-pressed={date===currentDate} onClick={()=>{setSelected(date);setSavedDate('');}}><span>{Number(date.slice(8))}</span><DayMarkers day={dayAt(data,date)}/></button>:<span key={`empty-${index}`} className="calendar-blank"/>)}</div><div className="calendar-legend"><span>◆ {d.startMarker}</span><span>━ {d.flowMarker}</span><span>● {d.noteMarker}</span></div></section>:<section className="history-list" aria-label={d.list}>{dates.length?<ol>{[...dates].reverse().map(date=><li key={date} className={date===highlight?'just-saved':''}><button aria-pressed={date===currentDate} onClick={()=>{setSelected(date);setSavedDate('');}}><time dateTime={date}>{formatDate(date)}</time><DayMarkers day={dayAt(data,date)}/><span className="sr-only">{dayLabel(dayAt(data,date))}</span><span aria-hidden="true">→</span></button></li>)}</ol>:<p>{d.noRecords}</p>}</section>}
 </div><section key={currentDate} ref={savedRef} tabIndex={-1} className={`selected-day ${highlight===currentDate?'just-saved':''}`} aria-label={d.dayDetails}><p className="eyebrow">{d.dayDetails}</p><h2>{formatDate(currentDate)}</h2><DayDetails day={dayAt(data,currentDate)}/><div className="day-actions"><button className="primary" disabled={unreadable} onClick={()=>open(currentDate)}>{hasObservation(dayAt(data,currentDate))?d.editDay:d.checkIn}</button>{hasObservation(dayAt(data,currentDate))&&<button className="text-button danger" disabled={unreadable} onClick={()=>setDeleteDate(currentDate)}>{d.deleteDay}</button>}</div></section></div>
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
