'use client';
import { useEffect, useRef, useState } from 'react';
import { type Diary, type Flow, type Cramps, validateDate } from '@/lib/diary';
import { dayAt, hasObservation, type Day } from '@/lib/daily';
import { d } from '@/lib/daily-strings';
import { s } from '@/lib/strings';

export function CheckIn({diary,date,today,onSave,onClose}:{diary:Diary;date:string;today:string;onSave:(draft:Day)=>boolean;onClose:()=>void}) {
 const initial=dayAt(diary,date);
 const [draft,setDraft]=useState<Day>(initial),[error,setError]=useState(''),[removeId,setRemoveId]=useState<string|null>(null),[dirty,setDirty]=useState(false);
 const modal=useRef<HTMLDialogElement>(null);
 const changed=(next:Day)=>{setDraft(next);setDirty(true);setError('');};
 const close=()=>{if(!dirty||window.confirm(d.discardQuestion))onClose();};
 useEffect(()=>{modal.current?.showModal();},[]);
 function save(e:React.FormEvent){e.preventDefault();const issue=validateDate(draft.date,today);if(issue){setError(s[issue]);return;}if(!hasObservation(draft)){setError(d.needOne);return;}if(!onSave(draft))setError(d.saveFailed);}
 return <dialog ref={modal} className="checkin-dialog" aria-labelledby="checkin-title" onCancel={e=>{e.preventDefault();close();}}><form onSubmit={save} noValidate>
 <p className="eyebrow">{s.diary}</p><h2 id="checkin-title">{d.checkIn}</h2><p className="fine-print">{d.needOne}</p>
 <label htmlFor="checkin-date">{d.date}</label><input autoFocus id="checkin-date" type="date" min="0001-01-01" max={today} value={draft.date} onChange={e=>{const value=e.target.value;if(!value)return;if(dirty&&!window.confirm(d.changeDateQuestion))return;setDraft(dayAt(diary,value));setDirty(false);setError('');}}/>
 <label className="start-checkbox"><input type="checkbox" checked={draft.periodStart} onChange={e=>changed({...draft,periodStart:e.target.checked})}/><span>{d.explicitStart}</span></label><p className="fine-print">{d.startHint}</p>
 <div className="form-columns"><div><label htmlFor="checkin-flow">{d.flow}</label><select id="checkin-flow" value={draft.flow??''} onChange={e=>changed({...draft,flow:(e.target.value||undefined) as Flow|undefined})}><option value="">{d.unknown}</option>{Object.entries(d.flows).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div><div><label htmlFor="checkin-cramps">{d.cramps}</label><select id="checkin-cramps" value={draft.cramps??''} onChange={e=>changed({...draft,cramps:(e.target.value||undefined) as Cramps|undefined})}><option value="">{d.unknown}</option>{Object.entries(d.crampLevels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div></div>
 <fieldset className="symptom-options"><legend>{d.symptoms}</legend>{[...new Set([...d.symptomOptions,...draft.symptoms])].map(symptom=><label key={symptom}><input type="checkbox" checked={draft.symptoms.includes(symptom)} onChange={e=>changed({...draft,symptoms:e.target.checked?[...draft.symptoms,symptom]:draft.symptoms.filter(v=>v!==symptom)})}/>{symptom}</label>)}</fieldset>
 <label htmlFor="checkin-note">{d.note}</label><textarea id="checkin-note" maxLength={1000} value={draft.note} onChange={e=>changed({...draft,note:e.target.value})} placeholder={d.notePlaceholder}/>
 {draft.legacyNotes.length>0&&<section className="legacy-notes"><h3>{d.oldNotes}</h3><p className="fine-print">{d.oldHint}</p>{draft.legacyNotes.map((note,index)=><div key={note.id}><label htmlFor={`old-note-${index}`}>{d.oldNote} {index+1}</label><textarea id={`old-note-${index}`} value={note.text} onChange={e=>changed({...draft,legacyNotes:draft.legacyNotes.map(n=>n.id===note.id?{...n,text:e.target.value}:n)})}/>{removeId===note.id?<div className="inline-confirm"><p>{d.removeNoteQuestion}</p><button type="button" className="secondary" onClick={()=>setRemoveId(null)}>{d.keep}</button><button type="button" className="secondary" onClick={()=>{changed({...draft,legacyNotes:draft.legacyNotes.filter(n=>n.id!==note.id)});setRemoveId(null);}}>{d.remove}</button></div>:<button type="button" className="text-button" onClick={()=>setRemoveId(note.id)}>{d.removeNote}</button>}</div>)}</section>}
 <div role="alert" className={error?'field-error':''}>{error}</div><div className="dialog-actions"><button type="button" className="secondary" onClick={close}>{d.cancel}</button><button type="submit" className="primary">{d.save}</button></div>
 </form></dialog>;
}
