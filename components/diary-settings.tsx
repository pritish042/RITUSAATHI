'use client';
import { useEffect, useRef, useState } from 'react';
import { type Diary } from '@/lib/diary';
import { makeBackup, readBackup, recordCounts } from '@/lib/daily';
import { d } from '@/lib/daily-strings';
import { s } from '@/lib/strings';

function download(text:string,name:string){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const anchor=document.createElement('a');anchor.href=url;anchor.download=name;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function DiarySettings({diary,today,unreadable,onSave,onClear}:{diary:Diary;today:string;unreadable:boolean;onSave:(next:Diary,replace?:boolean)=>boolean;onClear:()=>boolean}) {
 const [pending,setPending]=useState<Diary|null>(null),[notice,setNotice]=useState(''),[action,setAction]=useState<'restore'|'delete'|null>(null);
 const modal=useRef<HTMLDialogElement>(null),readId=useRef(0),fileRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(action)modal.current?.showModal();},[action]);
 async function importFile(file:File|undefined){const id=++readId.current;setPending(null);setNotice('');if(!file)return;try{if(file.size>2_000_000)throw new Error('Oversized backup');const parsed=readBackup(await file.text(),today);if(id===readId.current)setPending(parsed);}catch{if(id===readId.current)setNotice(d.importInvalid);}}
 function confirmAction(){
  if(action==='restore'&&pending){if(onSave(pending,true)){setPending(null);setNotice(d.restored);if(fileRef.current)fileRef.current.value='';}else setNotice(d.restoreFailed);}
  if(action==='delete'){setNotice(onClear()?s.deleteDiary:d.restoreFailed);}
  setAction(null);
 }
 const counts=pending?recordCounts(pending):null;
 return <>
 <section className="daily-title"><p className="eyebrow">{d.settings}</p><h1>{d.backupTitle}</h1><p>{d.settingsIntro}</p></section>
 <div role="status" className={notice?'notice':''}>{notice}</div>
 <section className="settings-section"><h2>{d.backup}</h2><p>{d.backupWarning}</p><button className="primary" onClick={()=>{try{if(unreadable){const raw=localStorage.getItem('ritusaathi.personal.v1');if(raw===null){setNotice(d.noBackup);return;}download(raw,`ritusaathi-original-${today}.json`);}else download(makeBackup(diary),`ritusaathi-backup-${today}.json`);}catch{setNotice(d.backupFailed);}}}>{unreadable?d.rawBackup:d.backup} ↓</button></section>
 <section className="settings-section"><h2>{d.restore}</h2><p>{d.restoreHint}</p><label htmlFor="restore-file">{d.restore}</label><input ref={fileRef} id="restore-file" type="file" accept=".json,application/json" onChange={e=>void importFile(e.target.files?.[0])}/>{counts&&<div className="import-preview"><h3>{d.restorePreview}</h3><p>{counts.days} {d.daysLogged} · {counts.starts} {d.starts} · {counts.notes} {d.notes}</p><p>{s.statuses[pending!.confirmation]}</p><button className="outline" onClick={()=>setAction('restore')}>{d.replace}</button></div>}</section>
 <section className="settings-section"><details><summary>{d.profile}</summary><p>{d.profileHint}</p>{s.profileQuestions.map(([key,label])=><fieldset key={key} disabled={unreadable}><legend>{label}</legend><div className="answer-options">{(['yes','no','unsure'] as const).map(value=><label key={value}><input type="radio" name={`profile-${key}`} checked={diary.eligibility[key]===value} onChange={()=>setNotice(onSave({...diary,eligibility:{...diary.eligibility,[key]:value}})?d.saved:d.saveFailed)}/>{value==='yes'?s.yes:value==='no'?s.no:s.unknown}</label>)}</div></fieldset>)}<button className="text-button" disabled={unreadable} onClick={()=>setNotice(onSave({...diary,eligibility:{adult:'',established:'',natural:'',outside:''}})?d.saved:d.saveFailed)}>{s.skip}</button></details></section>
 <section className="settings-section"><h2>{s.privacyTitle}</h2><p>{s.privacy}</p><p>{s.scopeText}</p><p className="fine-print">{s.reviewPending}</p><button className="text-button danger" onClick={()=>setAction('delete')}>{s.deleteDiary}</button></section>
 {action&&<dialog ref={modal} aria-labelledby="settings-confirm-title" onCancel={()=>setAction(null)}><h2 id="settings-confirm-title">{action==='restore'?d.replaceTitle:s.deleteTitle}</h2><p>{action==='restore'?d.replaceBody:s.deleteText}</p><div className="dialog-actions"><button className="secondary" onClick={()=>setAction(null)}>{d.cancel}</button><button className="primary" onClick={confirmAction}>{action==='restore'?d.replace:s.deleteConfirm}</button></div></dialog>}
 </>;
}
