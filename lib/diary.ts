/** Calendar dates are ISO dates, converted to UTC ordinal days, never elapsed local milliseconds. */
export type Answer = 'yes' | 'no' | 'unsure' | '';
export type Eligibility = { adult: Answer; established: Answer; natural: Answer; outside: Answer };
export type Note = { id: string; date: string; text: string };
export type Diary = { periods: string[]; notes: Note[]; eligibility: Eligibility; confirmation: 'unconfirmed' | 'complete' | 'unsure'; questions: string };
export const emptyEligibility = (): Eligibility => ({ adult: '', established: '', natural: '', outside: '' });
export const emptyDiary = (): Diary => ({ periods: [], notes: [], eligibility: emptyEligibility(), confirmation: 'unconfirmed', questions: '' });
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function ordinal(date: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '0001-01-01') throw new Error('Invalid calendar date');
  const d = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0,10) !== date) throw new Error('Invalid calendar date');
  return d.getTime()/86400000;
}
export const daysBetween = (a: string,b: string) => ordinal(b)-ordinal(a);
export function addDays(date: string,days: number) { return new Date((ordinal(date)+days)*86400000).toISOString().slice(0,10); }
export const sortedPeriods = (periods: string[]) => [...periods].sort();
export function intervals(periods: string[]) {
  const dates = sortedPeriods(periods);
  return dates.slice(1).map((end,i)=>({ start: dates[i], end, days: daysBetween(dates[i],end) }));
}
export const isEligible = (e: Eligibility) => Object.values(e).every(v=>v==='yes');
/** Prototype only, pending clinician review. Three consecutive intervals is a demo design choice. */
export function observation(periods: string[], eligibility: Eligibility) {
  const latest = intervals(periods).slice(-3);
  return isEligible(eligibility) && latest.length === 3 && latest.every(i=>i.days>35);
}
export function validateDate(date: string,today: string): 'invalid'|'future'|null {
  try { ordinal(date); } catch { return 'invalid'; }
  return date>today ? 'future' : null;
}
export function setPeriods(diary: Diary,periods: string[]): Diary {
  return { ...diary, periods: sortedPeriods(periods), confirmation: 'unconfirmed' };
}
export function splitInterval(previous: string[],added: string) {
  const containing = intervals(previous).find(i=>i.start<added && added<i.end);
  return containing ? { ...containing, first: daysBetween(containing.start,added), second: daysBetween(added,containing.end) } : null;
}
export function seedDiary(today: string): Diary {
  return { ...emptyDiary(), periods: [141,99,51,7].map(n=>addDays(today,-n)), eligibility: {adult:'yes',established:'yes',natural:'yes',outside:'yes'}, notes:[{id:'fictional-note',date:addDays(today,-15),text:'New coarse facial hair noticed on my chin.'}] };
}
export function midpoint(periods: string[]): string | null {
  const widest = intervals(periods).sort((a,b)=>b.days-a.days)[0];
  return widest && widest.days%2===0 ? addDays(widest.start,widest.days/2) : null;
}
/** Validate local data before rendering. Invalid data never silently becomes a new diary. */
export function parseDiary(raw: string): Diary {
  const d = JSON.parse(raw);
  if (!d || !Array.isArray(d.periods) || !Array.isArray(d.notes) || !d.eligibility || typeof d.questions!=='string' || !['unconfirmed','complete','unsure'].includes(d.confirmation)) throw new Error('Invalid diary');
  if (d.periods.some((p: unknown)=>typeof p!=='string' || validateDate(p,todayISO())!==null) || new Set(d.periods).size!==d.periods.length) throw new Error('Invalid periods');
  if (!['adult','established','natural','outside'].every(k=>['yes','no','unsure',''].includes(d.eligibility[k]))) throw new Error('Invalid profile');
  if (d.notes.some((n: Note)=>!n || typeof n.id!=='string' || typeof n.text!=='string' || typeof n.date!=='string' || validateDate(n.date,todayISO())!==null)) throw new Error('Invalid notes');
  return { ...d, periods: sortedPeriods(d.periods) };
}
