import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, emptyDiary, intervals, parseDiary } from '../lib/diary';
import { dayAt, hasObservation, loggedDates, makeBackup, monthCells, putDay, readBackup, recordCounts, removeDay, shiftMonth, subtractMonths, summaryRecords } from '../lib/daily';
import { loadDiary, saveDiary, resetExample } from '../lib/storage';
const today='2026-11-16';
const v1={periods:['2026-07-01','2026-08-12','2026-09-29','2026-11-12'],notes:[{id:'old-one',date:'2026-11-12',text:'First older private note'},{id:'old-two',date:'2026-11-12',text:'Second older private note'}],eligibility:{adult:'yes',established:'yes',natural:'yes',outside:'yes'},confirmation:'complete',questions:'My existing question'};
function memory(){const map=new Map<string,string>();return {getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);},removeItem:(key:string)=>{map.delete(key);}};}
test('production v1 data upgrades losslessly in memory without overwriting saved bytes',()=>{
 const storage=memory(),raw=JSON.stringify(v1);storage.setItem('ritusaathi.personal.v1',raw);
 const upgraded=loadDiary(storage,'personal',today);
 assert.equal(upgraded.schemaVersion,2);assert.deepEqual(upgraded.entries,[]);
 for(const key of ['periods','notes','eligibility','confirmation','questions'] as const)assert.deepEqual(upgraded[key],v1[key]);
 assert.equal(storage.getItem('ritusaathi.personal.v1'),raw);
 saveDiary(storage,'personal',upgraded);assert.deepEqual(loadDiary(storage,'personal',today),upgraded);
});
test('yesterday start and today flow remain two days but one start, including after reload',()=>{
 const storage=memory();let diary=emptyDiary();
 diary=putDay(diary,{...dayAt(diary,'2026-11-15'),periodStart:true},today);
 diary=putDay(diary,{...dayAt(diary,today),flow:'medium'},today);
 saveDiary(storage,'personal',diary);diary=loadDiary(storage,'personal',today);
 assert.deepEqual(diary.periods,['2026-11-15']);assert.deepEqual(loggedDates(diary),['2026-11-15',today]);assert.deepEqual(intervals(diary.periods),[]);
 assert.equal(dayAt(diary,today).periodStart,false);assert.equal(dayAt(diary,today).cramps,undefined);
});
test('spotting never becomes a period start; explicit none cramps is a known observation',()=>{
 let diary=putDay(emptyDiary(),{...dayAt(emptyDiary(),today),flow:'spotting'},today);
 assert.deepEqual(diary.periods,[]);
 diary=putDay(diary,{...dayAt(diary,today),flow:undefined,cramps:'none'},today);
 assert.equal(dayAt(diary,today).flow,undefined);assert.equal(dayAt(diary,today).cramps,'none');assert.equal(hasObservation(dayAt(diary,today)),true);
 assert.throws(()=>putDay(emptyDiary(),dayAt(emptyDiary(),today),today));
});
test('editing one day preserves starts, multiple legacy notes, and confirmation; creates no duplicate',()=>{
 let diary=parseDiary(JSON.stringify(v1),today);
 const day=dayAt(diary,'2026-11-12');assert.equal(day.legacyNotes.length,2);
 diary=putDay(diary,{...day,cramps:'mild',flow:'light'},today);
 diary=putDay(diary,{...dayAt(diary,'2026-11-12'),cramps:'severe'},today);
 assert.equal(diary.entries.length,1);assert.equal(dayAt(diary,'2026-11-12').cramps,'severe');assert.deepEqual(diary.notes,v1.notes);assert.equal(diary.confirmation,'complete');
 assert.equal(summaryRecords(diary,today,'90',true).days.find(e=>e.date==='2026-11-12')?.cramps,'severe');
});
test('only changes to explicit starts invalidate confirmation; removing a day removes all its observations',()=>{
 let diary=parseDiary(JSON.stringify(v1),today);
 diary=putDay(diary,{...dayAt(diary,today),note:'Test note'},today);assert.equal(diary.confirmation,'complete');
 diary=removeDay(diary,today);assert.equal(diary.confirmation,'complete');
 diary=putDay(diary,{...dayAt(diary,today),periodStart:true},today);assert.equal(diary.confirmation,'unconfirmed');
 diary=removeDay(diary,'2026-11-12');assert.equal(dayAt(diary,'2026-11-12').legacyNotes.length,0);assert.equal(hasObservation(dayAt(diary,'2026-11-12')),false);
});
test('summary counts distinct days logged and filters exact date ranges, not symptoms-free days',()=>{
 let diary=emptyDiary();
 for(const date of [addDays(today,-90),addDays(today,-89),today])diary=putDay(diary,{...dayAt(diary,date),note:'Test',periodStart:true},today);
 const summary=summaryRecords(diary,today,'90',false);
 assert.equal(summary.from,addDays(today,-89));assert.equal(summary.to,today);assert.equal(summary.daysLogged,2);assert.equal(summary.periods.length,2);
 assert.equal(summary.intervals.length,2);assert.equal(summary.intervals[0].start,addDays(today,-90));
 assert.equal(summaryRecords(diary,today,'all',true).daysLogged,3);
 assert.equal(subtractMonths('2024-08-31',6),'2024-02-29');assert.equal(subtractMonths('2025-08-31',6),'2025-02-28');
 assert.equal(summaryRecords(diary,today,'6months',true).from,'2026-05-16');
});
test('free-text exclusion removes both daily and multiple legacy notes from summary data',()=>{
 let diary=parseDiary(JSON.stringify(v1),today);diary=putDay(diary,{...dayAt(diary,'2026-11-12'),note:'New private note',symptoms:['Headache']},today);
 const excluded=summaryRecords(diary,today,'all',false);
 assert.equal(JSON.stringify(excluded).includes('private note'),false);assert.deepEqual(excluded.days.find(day=>day.date==='2026-11-12')?.symptoms,['Headache']);
 assert.equal(excluded.daysLogged,4);
});
test('backup round trips all observations, legacy notes, profile, confirmation, questions; resets stay separate',()=>{
 const storage=memory();let diary=parseDiary(JSON.stringify(v1),today);
 diary=putDay(diary,{...dayAt(diary,today),flow:'heavy',cramps:'moderate',symptoms:['Headache'],note:'Synthetic private note'},today);
 const restored=readBackup(makeBackup(diary),today);assert.deepEqual(restored,diary);
 saveDiary(storage,'personal',restored);const before=storage.getItem('ritusaathi.personal.v1');resetExample(storage,today);assert.equal(storage.getItem('ritusaathi.personal.v1'),before);
 assert.deepEqual(recordCounts(diary),{days:5,starts:4,notes:3});
});
test('invalid, future, duplicate, and unknown-version imports cannot mutate existing storage',()=>{
 const storage=memory();saveDiary(storage,'personal',parseDiary(JSON.stringify(v1),today));const before=storage.getItem('ritusaathi.personal.v1');
 const backup=JSON.parse(makeBackup(emptyDiary()));
 for(const raw of ['{bad','{}',JSON.stringify({...backup,version:99}),JSON.stringify({...backup,diary:{...emptyDiary(),entries:[{date:'2026-11-17',symptoms:[],note:'future'}]}}),JSON.stringify({...backup,diary:{...emptyDiary(),entries:[{date:today,flow:'unknown',symptoms:[],note:''}]}}),JSON.stringify({...backup,diary:{...emptyDiary(),periods:[today,today]}}),JSON.stringify({...backup,diary:{...emptyDiary(),notes:[{id:'x',date:today,text:'x'},{id:'x',date:today,text:'y'}]}})])assert.throws(()=>readBackup(raw,today));
 assert.equal(storage.getItem('ritusaathi.personal.v1'),before);
});
test('storage failure leaves persisted and rendered diary objects unchanged',()=>{
 const original=emptyDiary();const next=putDay(original,{...dayAt(original,today),flow:'light'},today);
 assert.throws(()=>saveDiary({getItem:()=>null,removeItem:()=>{},setItem:()=>{throw new Error('Quota exceeded');}},'personal',next));
 assert.deepEqual(original,emptyDiary());
});
test('month calendar handles leap years, weekday offsets, and year navigation',()=>{
 const feb=monthCells('2024-02');assert.equal(feb.filter(Boolean).length,29);assert.equal(feb[3],'2024-02-01');assert.equal(feb.at(-1),'2024-02-29');
 assert.equal(shiftMonth('2026-12',1),'2027-01');assert.equal(shiftMonth('2026-01',-1),'2025-12');
});

test('optional daily impact preserves unknown versus unaffected through save, reload, and backup',()=>{
 const storage=memory();const prior=parseDiary(JSON.stringify(v1),today);
 assert.equal(dayAt(prior,'2026-11-12').impact,undefined);
 const updated=putDay(prior,{...dayAt(prior,today),impact:{sleep:true,studyWork:false}},today);
 saveDiary(storage,'personal',updated);
 const loaded=loadDiary(storage,'personal',today),day=dayAt(loaded,today);
 assert.deepEqual(day.impact,{sleep:true,studyWork:false});assert.equal(Object.hasOwn(day.impact??{},'usualActivities'),false);
 assert.equal(hasObservation(day),true);assert.ok(loggedDates(loaded).includes(today));
 assert.deepEqual(readBackup(makeBackup(loaded),today),loaded);
 assert.deepEqual(loaded.notes,prior.notes);assert.deepEqual(loaded.periods,prior.periods);assert.equal(loaded.confirmation,'complete');
 const unaffected=putDay(emptyDiary(),{...dayAt(emptyDiary(),today),impact:{sleep:false}},today);
 assert.equal(loggedDates(unaffected).length,1);
 assert.throws(()=>putDay(emptyDiary(),{...dayAt(emptyDiary(),today),impact:{}},today));
 const cleared=putDay(loaded,{...day,impact:{},note:'Kept note'},today);
 assert.deepEqual(dayAt(cleared,today).impact,{});assert.equal(dayAt(cleared,today).note,'Kept note');
});
test('impact validation rejects corrupt values without accepting inferred defaults',()=>{
 for(const impact of [null,[],true,{sleep:'yes'},{studyWork:1},{unknown:true}])assert.throws(()=>parseDiary(JSON.stringify({...emptyDiary(),entries:[{date:today,note:'',symptoms:[],impact}]}),today));
});
test('logging completeness reports inclusive date-range denominators and distinct days',()=>{
 let diary=putDay(emptyDiary(),{...dayAt(emptyDiary(),today),periodStart:true,impact:{sleep:true}},today);
 diary=putDay(diary,{...dayAt(diary,addDays(today,-4)),note:'Earlier'},today);
 assert.equal(summaryRecords(diary,today,'90',true).totalDays,90);
 assert.equal(summaryRecords(diary,today,'90',true).daysLogged,2);
 assert.equal(summaryRecords(diary,today,'all',true).totalDays,5);
 assert.equal(summaryRecords(emptyDiary(),today,'all',true).totalDays,1);
 assert.equal(summaryRecords(emptyDiary(),today,'all',true).daysLogged,0);
});
