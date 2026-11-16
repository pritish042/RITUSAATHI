import { addDays, type Diary, type DailyEntry, type Note, intervals, parseDiary, setPeriods, validateDate } from './diary';

export type Day = DailyEntry & { periodStart: boolean; legacyNotes: Note[] };
export function dayAt(diary: Diary, date: string): Day {
  const entry = diary.entries.find(e=>e.date===date);
  return {date, symptoms:[], note:'', ...entry, periodStart: diary.periods.includes(date), legacyNotes:diary.notes.filter(n=>n.date===date).map(n=>({...n}))};
}
export function hasObservation(day: Day): boolean {
  return day.periodStart || !!day.flow || day.cramps !== undefined || day.symptoms.length>0 || !!day.note.trim() || day.legacyNotes.some(n=>!!n.text.trim());
}
export function loggedDates(diary: Diary): string[] {
  return [...new Set([...diary.periods, ...diary.notes.map(n=>n.date), ...diary.entries.filter(e=>!!e.flow||e.cramps!==undefined||!!e.note.trim()||e.symptoms.length>0).map(e=>e.date)])].sort();
}
/** Save exactly one daily record; starts remain explicit and independent of flow. */
export function putDay(diary: Diary, day: Day, today: string): Diary {
  if(validateDate(day.date,today)) throw new Error('Invalid date');
  if(!hasObservation(day)) throw new Error('An observation is required');
  const nextPeriods=diary.periods.filter(d=>d!==day.date);
  if(day.periodStart) nextPeriods.push(day.date);
  const changed=diary.periods.includes(day.date)!==day.periodStart;
  const next=changed?setPeriods(diary,nextPeriods):{...diary};
  const entry: DailyEntry={date:day.date,...(day.flow?{flow:day.flow}:{}),...(day.cramps!==undefined?{cramps:day.cramps}:{}),symptoms:[...day.symptoms],note:day.note.trim()};
  const entries=diary.entries.filter(e=>e.date!==day.date);
  if(entry.flow||entry.cramps!==undefined||entry.symptoms.length||entry.note)entries.push(entry);
  return {...next, entries:entries.sort((a,b)=>a.date.localeCompare(b.date)), notes:[...diary.notes.filter(n=>n.date!==day.date),...day.legacyNotes.map(n=>({...n,date:day.date}))]};
}
export function removeDay(diary: Diary,date: string): Diary {
  const next=diary.periods.includes(date)?setPeriods(diary,diary.periods.filter(d=>d!==date)):{...diary};
  return {...next, entries:diary.entries.filter(e=>e.date!==date),notes:diary.notes.filter(n=>n.date!==date)};
}
export type Range = '90' | '6months' | 'all';
export function subtractMonths(date:string,count:number):string {
  const [year,month,day]=date.split('-').map(Number);
  const base=new Date(Date.UTC(year,month-1-count,1));
  const last=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+1,0)).getUTCDate();
  return `${base.getUTCFullYear()}-${String(base.getUTCMonth()+1).padStart(2,'0')}-${String(Math.min(day,last)).padStart(2,'0')}`;
}
export function summaryRecords(diary:Diary,today:string,range:Range,includeNotes:boolean) {
  const allDates=loggedDates(diary);
  const from=range==='90'?addDays(today,-89):range==='6months'?subtractMonths(today,6):(allDates[0]??today);
  const dates=allDates.filter(d=>d>=from&&d<=today);
  return {from,to:today,daysLogged:dates.length,periods:diary.periods.filter(d=>d>=from&&d<=today),intervals:intervals(diary.periods).filter(i=>i.end>=from&&i.end<=today),days:dates.map(date=>{
    const day=dayAt(diary,date);
    return {...day,note:includeNotes?day.note:'',legacyNotes:includeNotes?day.legacyNotes:[]};
  })};
}
export function monthCells(month: string): (string|null)[] {
  const [year,m]=month.split('-').map(Number);
  const first=`${month}-01`;
  const weekday=(new Date(`${first}T00:00:00Z`).getUTCDay()+6)%7;
  const days=new Date(Date.UTC(year,m,0)).getUTCDate();
  return [...Array(weekday).fill(null),...Array.from({length:days},(_,i)=>`${month}-${String(i+1).padStart(2,'0')}`)];
}
export function shiftMonth(month:string,delta:number):string {
  return subtractMonths(`${month}-01`,-delta).slice(0,7);
}
export function makeBackup(diary:Diary,now=new Date()):string {
  return JSON.stringify({app:'RituSaathi',version:2,exportedAt:now.toISOString(),diary},null,2);
}
export function readBackup(raw:string,today:string):Diary {
  if(new TextEncoder().encode(raw).length>2_000_000)throw new Error('Backup too large');
  const file=JSON.parse(raw);
  if(!file || file.app!=='RituSaathi' || file.version!==2 || typeof file.exportedAt!=='string' || !Number.isFinite(Date.parse(file.exportedAt)))throw new Error('Invalid backup');
  return parseDiary(JSON.stringify(file.diary),today);
}
export function recordCounts(diary:Diary){return {days:loggedDates(diary).length,starts:diary.periods.length,notes:diary.notes.length+diary.entries.filter(e=>!!e.note).length};}
