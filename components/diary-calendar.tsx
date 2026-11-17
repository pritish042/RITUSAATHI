'use client';
import { useEffect, useRef } from 'react';
import { addDays, type Diary } from '@/lib/diary';
import { dayAt, monthCells, shiftMonth } from '@/lib/daily';
import { d } from '@/lib/daily-strings';
import { formatMonthYear } from '@/lib/strings';
import { DayMarkers, dayLabel } from './day-details';
export function DiaryCalendar({diary,today,month,selected,onMonth,onSelect,compact=false}:{diary:Diary;today:string;month:string;selected:string;onMonth:(month:string)=>void;onSelect:(date:string)=>void;compact?:boolean}){
 const grid=useRef<HTMLDivElement>(null),pendingFocus=useRef('');
 useEffect(()=>{if(pendingFocus.current){grid.current?.querySelector<HTMLButtonElement>(`[data-date="${pendingFocus.current}"]`)?.focus();pendingFocus.current='';}},[month,selected]);
 function navigate(e:React.KeyboardEvent,date:string){
  const delta:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};
  if(!(e.key in delta))return;
  e.preventDefault();const next=addDays(date,delta[e.key]);if(next>today||next<'0001-01-01')return;
  pendingFocus.current=next;onMonth(next.slice(0,7));onSelect(next);
 }
 const cells=monthCells(month),focusDate=cells.includes(selected)?selected:cells.includes(today)?today:`${month}-01`;
 return <section className={`month-calendar journal-card ${compact?'compact-calendar':''}`} aria-label={d.calendar}>
 <div className="month-controls"><h2 aria-live="polite">{formatMonthYear(`${month}-01`)}</h2><div><button aria-label={d.previous} disabled={month==='0001-01'} onClick={()=>onMonth(shiftMonth(month,-1))}>‹</button>{!compact&&<button onClick={()=>{onMonth(today.slice(0,7));onSelect(today);}}>{d.today}</button>}<button aria-label={d.next} disabled={month>=today.slice(0,7)} onClick={()=>onMonth(shiftMonth(month,1))}>›</button></div></div>
 <div className="calendar-weekdays" aria-hidden="true">{d.weekdays.map(day=><span key={day}>{compact?day[0]:day}</span>)}</div>
 <div className="calendar-grid" ref={grid}>{cells.map((date,index)=>date?<button key={date} data-date={date} tabIndex={date===focusDate?0:-1} disabled={date>today} className={`${date===today?'is-today ':''}${date===selected?'is-selected ':''}${diary.periods.includes(date)?'has-start ':''}${dayAt(diary,date).flow?'has-flow':''}`} aria-label={dayLabel(dayAt(diary,date))+(date===today?`, ${d.today}`:'')} aria-pressed={date===selected} onKeyDown={e=>navigate(e,date)} onClick={()=>onSelect(date)}><span>{Number(date.slice(8))}</span><DayMarkers day={dayAt(diary,date)}/></button>:<span key={`empty-${index}`} className="calendar-blank"/>)}</div>
 <div className="calendar-legend"><span><i className="legend-start"/>Period start</span><span><i className="legend-flow"/>Flow</span><span><i className="legend-note"/>Observation</span></div>
 {!compact&&<p className="calendar-help">Use arrow keys to move between dates. Blank days are unknown.</p>}
 </section>;
}
