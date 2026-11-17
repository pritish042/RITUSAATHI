'use client';
import { useEffect, useRef, useState } from 'react';
import { type Diary, type Flow, type Cramps, type DailyImpact, validateDate } from '@/lib/diary';
import { dayAt, hasObservation, type Day } from '@/lib/daily';
import { d } from '@/lib/daily-strings';
import { s } from '@/lib/strings';
import { Icon } from './diary-icons';

function Choices({legend,name,value,options,onChange}:{legend:string;name:string;value:string;options:[string,string][];onChange:(value:string)=>void}){return <fieldset className="choice-group"><legend>{legend}</legend><div>{options.map(([key,label])=><label key={key}><input type="radio" name={name} value={key} checked={value===key} onChange={()=>onChange(key)}/><span>{label}</span></label>)}</div></fieldset>;}

export function CheckIn({diary,date,today,onSave,onClose}:{diary:Diary;date:string;today:string;onSave:(draft:Day)=>boolean;onClose:()=>void}) {
 const initial=dayAt(diary,date);
 const [draft,setDraft]=useState<Day>(initial),[error,setError]=useState(''),[removeId,setRemoveId]=useState<string|null>(null),[dirty,setDirty]=useState(false);
 const modal=useRef<HTMLDialogElement>(null);
 const changed=(next:Day)=>{setDraft(next);setDirty(true);setError('');};
 const close=()=>{if(!dirty||window.confirm(d.discardQuestion))onClose();};
 useEffect(()=>{modal.current?.showModal();},[]);
 function save(e:React.FormEvent){e.preventDefault();const issue=validateDate(draft.date,today);if(issue){setError(s[issue]);return;}if(!hasObservation(draft)){setError(d.needOne);return;}if(!onSave(draft))setError(d.saveFailed);}
 return <dialog ref={modal} className="checkin-dialog" aria-labelledby="checkin-title" onCancel={e=>{e.preventDefault();close();}}><form onSubmit={save} noValidate>
 <div className="checkin-heading"><p className="eyebrow">A moment for yourself · {s.diary}</p><button type="button" className="icon-button" aria-label="Close check-in" onClick={close}><Icon name="close"/></button><h2 id="checkin-title">{d.checkIn}</h2><p>Record how the day felt. Every field is optional.</p><p className="fine-print">{d.needOne}</p></div>
 <label htmlFor="checkin-date">{d.date}</label><input autoFocus id="checkin-date" type="date" min="0001-01-01" max={today} value={draft.date} onChange={e=>{const value=e.target.value;if(!value)return;if(dirty&&!window.confirm(d.changeDateQuestion))return;setDraft(dayAt(diary,value));setDirty(false);setError('');}}/>
 <label className="start-checkbox"><input type="checkbox" checked={draft.periodStart} onChange={e=>changed({...draft,periodStart:e.target.checked})}/><span>{d.explicitStart}</span></label><p className="fine-print">{d.startHint}</p>
 <Choices legend={d.flow} name="flow" value={draft.flow??''} options={[["",d.unknown],...Object.entries(d.flows)]} onChange={value=>changed({...draft,flow:(value||undefined) as Flow|undefined})}/>
 <Choices legend={d.cramps} name="cramps" value={draft.cramps??''} options={[["",d.unknown],...Object.entries(d.crampLevels)]} onChange={value=>changed({...draft,cramps:(value||undefined) as Cramps|undefined})}/>
 <fieldset className="symptom-options"><legend>{d.symptoms}</legend>{[...new Set([...d.symptomOptions,...draft.symptoms])].map(symptom=><label key={symptom}><input type="checkbox" checked={draft.symptoms.includes(symptom)} onChange={e=>changed({...draft,symptoms:e.target.checked?[...draft.symptoms,symptom]:draft.symptoms.filter(v=>v!==symptom)})}/>{symptom}</label>)}</fieldset>
 <section className="impact-fields"><h3>Daily-life impact <span>(optional)</span></h3><p className="fine-print">Did symptoms affect any part of your day?</p>{(Object.entries(d.impactLabels) as [keyof DailyImpact,string][]).map(([key,label])=><Choices key={key} legend={label} name={`impact-${key}`} value={draft.impact?.[key]===undefined?'':String(draft.impact[key])} options={[["",d.unknown],["true","Affected"],["false","Not affected"]]} onChange={value=>{const impact={...draft.impact};if(value==='')delete impact[key];else impact[key]=value==='true';changed({...draft,impact});}}/>)}</section>
 <label htmlFor="checkin-note">Personal observation <span>(optional)</span></label><textarea className="reflection-input" id="checkin-note" maxLength={1000} value={draft.note} onChange={e=>changed({...draft,note:e.target.value})} placeholder={d.notePlaceholder}/>
 {draft.legacyNotes.length>0&&<section className="legacy-notes"><h3>{d.oldNotes}</h3><p className="fine-print">{d.oldHint}</p>{draft.legacyNotes.map((note,index)=><div key={note.id}><label htmlFor={`old-note-${index}`}>{d.oldNote} {index+1}</label><textarea id={`old-note-${index}`} value={note.text} onChange={e=>changed({...draft,legacyNotes:draft.legacyNotes.map(n=>n.id===note.id?{...n,text:e.target.value}:n)})}/>{removeId===note.id?<div className="inline-confirm"><p>{d.removeNoteQuestion}</p><button type="button" className="secondary" onClick={()=>setRemoveId(null)}>{d.keep}</button><button type="button" className="secondary" onClick={()=>{changed({...draft,legacyNotes:draft.legacyNotes.filter(n=>n.id!==note.id)});setRemoveId(null);}}>{d.remove}</button></div>:<button type="button" className="text-button" onClick={()=>setRemoveId(note.id)}>{d.removeNote}</button>}</div>)}</section>}
 <div role="alert" className={error?'field-error':''}>{error}</div><div className="dialog-actions"><button type="button" className="secondary" onClick={close}>{d.cancel}</button><button type="submit" className="primary"><Icon name="check" size={18}/>{d.save}</button></div>
 </form></dialog>;
}
