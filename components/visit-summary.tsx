'use client';
import { useState } from 'react';
import { type Diary, isEligible, observation, intervals } from '@/lib/diary';
import { summaryRecords, type Range } from '@/lib/daily';
import { d } from '@/lib/daily-strings';
import { s, formatDate } from '@/lib/strings';
import { DayDetails } from './day-details';
import { Icon } from './diary-icons';
export function SummaryDocument({diary,today,range,includeNotes,example=false}:{diary:Diary;today:string;range:Range;includeNotes:boolean;example?:boolean}){
 const records=summaryRecords(diary,today,range,includeNotes);
 const trigger=observation(diary.periods,diary.eligibility),latest=intervals(diary.periods).slice(-3).map(i=>i.days);
 return <article className="print-sheet summary-document" aria-label={d.preview}>
 <div className="print-sheet-brand"><strong>{s.name}</strong><span>{formatDate(today)}</span></div>{example&&<p className="example-badge">{s.example}</p>}
 <p className="eyebrow">Personal diary report · Recorded observations</p><h1>{s.summary}</h1><p className="summary-date-range">{d.rangeLabel}: {formatDate(records.from)} – {formatDate(records.to)}</p><p className="logged-count"><strong>{records.daysLogged}</strong> of {records.totalDays} {d.daysLogged}</p><p className="fine-print">{d.gaps}</p>
 <section><h2>{s.status}</h2><p>{s.statuses[diary.confirmation]}</p></section>
 <div className="summary-columns"><section><h2>{s.dates}</h2>{records.periods.length?<ul>{records.periods.map(date=><li key={date}>{formatDate(date)}</li>)}</ul>:<p>{d.noDates}</p>}</section><section><h2>{s.intervals}</h2>{records.intervals.length?<><ol>{records.intervals.map(c=><li key={c.end}><strong>{c.days} {s.cycle}</strong><span className="date-range">{formatDate(c.start)} → {formatDate(c.end)}</span></li>)}</ol><p className="interval-average">Mean recorded interval: <strong>{(records.intervals.reduce((sum,c)=>sum+c.days,0)/records.intervals.length).toFixed(1)} days</strong> across {records.intervals.length} completed {records.intervals.length===1?'interval':'intervals'}.</p></>:<p>{d.noNewInterval}</p>}<p className="fine-print">{d.intervalRange}</p></section></div>
 <section><h2>{d.dailyObservations}</h2>{!includeNotes&&<p className="fine-print">{d.freeNotes}</p>}{records.days.length?<div className="summary-days">{records.days.map(day=><section key={day.date}><h3>{formatDate(day.date)}</h3><DayDetails day={day} includeNotes={includeNotes}/></section>)}</div>:<p>{d.noDays}</p>}</section>
 <section><h2>{s.questions}</h2><p className="preserve">{diary.questions||s.questionsEmpty}</p></section>
 <section><h2>{s.context}</h2>{trigger&&<p className="fine-print">This observation uses the full saved history: {intervals(diary.periods).slice(-3).map(i=>`${formatDate(i.start)} → ${formatDate(i.end)} (${i.days} days)`).join('; ')}.</p>}<p>{trigger?(diary.confirmation==='complete'?s.confirmed(latest):s.prompt(latest)):s.noPrompt}</p><p>{isEligible(diary.eligibility)?s.eligible:s.ineligible}</p><p>{s.ruleNote}</p><p>{s.scopeText}</p><p className="fine-print">{s.reviewPending} · <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10505534/">{s.reference}</a></p></section>
 </article>;
}
export function VisitSummary({diary,today,onSave,example=false,disabled=false}:{diary:Diary;today:string;onSave:(next:Diary)=>boolean;example?:boolean;disabled?:boolean}) {
 const [range,setRange]=useState<Range>(example?'all':'90'),[includeNotes,setIncludeNotes]=useState(true),[questions,setQuestions]=useState(diary.questions),[notice,setNotice]=useState('');
 const records=summaryRecords(diary,today,range,includeNotes);
 return <>
 <section className="daily-title no-print"><p className="eyebrow">Prepared for your next conversation</p><h1>{s.summaryTitle}</h1><p>{s.summaryIntro} {d.previewHint}</p></section>
 <section className="summary-controls no-print"><div><label htmlFor="summary-range">{d.range}</label><select id="summary-range" value={range} onChange={e=>setRange(e.target.value as Range)}>{Object.entries(d.ranges).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div><div><label className="include-notes"><input type="checkbox" checked={includeNotes} onChange={e=>setIncludeNotes(e.target.checked)}/>{d.includeNotes}</label><p className="fine-print">{d.excludeHint}</p></div><button className="primary" onClick={()=>window.print()}><Icon name="print"/>{s.print}</button></section>
 <section className="completeness-banner no-print"><span className="round-icon"><Icon name="book"/></span><div><p><strong>Logging completeness:</strong> {records.daysLogged} of {records.totalDays} days logged · {s.statuses[diary.confirmation]}</p><p>{formatDate(records.from)} – {formatDate(records.to)}. Unlogged days are unknown.</p></div></section>
 <details className="question-editor no-print"><summary>{d.editQuestions}</summary><label htmlFor="summary-questions">{s.questions}</label><textarea id="summary-questions" value={questions} disabled={disabled} onChange={e=>{setQuestions(e.target.value);setNotice('');}} placeholder={d.questionsPlaceholder}/><button className="outline" disabled={disabled} onClick={()=>setNotice(onSave({...diary,questions})?d.questionsSaved:d.questionsFailed)}>{d.saveQuestions}</button><p role="status">{notice}</p></details>
 <SummaryDocument diary={diary} today={today} range={range} includeNotes={includeNotes} example={example}/>
 </>;
}
