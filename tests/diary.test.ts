import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, daysBetween, emptyDiary, intervals, isEligible, midpoint, observation, ordinal, parseDiary, seedDiary, setPeriods, splitInterval, todayISO, validateDate } from '../lib/diary';
const today='2026-11-16';
const seed=seedDiary(today);
test('seed is relative to today, adult eligible, with one dated note and 42,48,44 cycles',()=>{
 assert.deepEqual(seed.periods,[141,99,51,7].map(n=>addDays(today,-n)));
 assert.deepEqual(intervals(seed.periods).map(i=>i.days),[42,48,44]);
 assert.equal(isEligible(seed.eligibility),true); assert.equal(seed.notes.length,1);
 assert.equal(observation(seed.periods,seed.eligibility),true);
});
test('midpoint correction derives split from real dates and withdraws observation',()=>{
 const added=midpoint(seed.periods)!;
 const split=splitInterval(seed.periods,added)!;
 assert.equal(split.days,48);assert.equal(split.first,24);assert.equal(split.second,24);
 const next=setPeriods({...seed,confirmation:'complete'},[...seed.periods,added]);
 assert.deepEqual(intervals(next.periods).map(i=>i.days),[42,24,24,44]);
 assert.equal(observation(next.periods,next.eligibility),false);assert.equal(next.confirmation,'unconfirmed');
});
test('35 is excluded; each of latest three must exceed 35',()=>{
 const dates=(lengths:number[])=>lengths.reduce((acc,n)=>[...acc,addDays(acc.at(-1)!,n)],['2025-01-01']);
 for(const lengths of [[35,36,36],[36,35,36],[36,36,35]])assert.equal(observation(dates(lengths),seed.eligibility),false);
 assert.equal(observation(dates([36,36,36]),seed.eligibility),true);
 assert.equal(observation(dates([20,36,36,36]),seed.eligibility),true);
 assert.equal(observation(dates([36,36]),seed.eligibility),false);
 assert.equal(observation(dates([36,36,36,20]),seed.eligibility),false);
});
test('every eligibility answer must explicitly be yes; symptoms are not required',()=>{
 for(const key of Object.keys(seed.eligibility))for(const answer of ['no','unsure',''] as const)assert.equal(observation(seed.periods,{...seed.eligibility,[key]:answer}),false);
 assert.equal(observation(seed.periods,{adult:'yes',established:'yes',natural:'yes',outside:'yes'}),true);
 assert.equal(observation([],seed.eligibility),false);
});
test('calendar arithmetic handles leap days, year boundaries, and DST',()=>{
 assert.equal(daysBetween('2024-02-28','2024-03-01'),2);
 assert.equal(daysBetween('2025-02-28','2025-03-01'),1);
 assert.equal(daysBetween('2025-12-31','2026-01-01'),1);
 assert.equal(daysBetween('2026-03-07','2026-03-10'),3);
 assert.equal(daysBetween('2026-10-31','2026-11-02'),2);
 assert.equal(addDays('2024-03-01',-1),'2024-02-29');
 assert.equal(daysBetween('0099-12-31','0100-01-01'),1);
 for(const zone of ['UTC','America/New_York','Asia/Kolkata','Pacific/Auckland']){process.env.TZ=zone;assert.equal(daysBetween('2026-03-07','2026-03-10'),3);assert.equal(todayISO(new Date(2026,10,16,23,59)),'2026-11-16');}
});
test('dates are valid calendar dates, no future entries',()=>{
 for(const bad of ['','2025-02-29','2024-02-30','2026-13-01','2026-00-10','0000-01-01','2026-1-01','not-a-date']){assert.throws(()=>ordinal(bad));assert.equal(validateDate(bad,today),'invalid');}
 assert.equal(validateDate('2026-11-17',today),'future');assert.equal(validateDate(today,today),null);
});
test('sparse history never counts elapsed days as an interval',()=>{
 assert.deepEqual(intervals([]),[]);assert.deepEqual(intervals(['2026-11-01']),[]);
 assert.deepEqual(intervals([...seed.periods].reverse()).map(i=>i.days),[42,48,44]);
});
test('personal and fictional records are independent; changed dates invalidate confirmation',()=>{
 const personal={...emptyDiary(),periods:['2026-01-01'],questions:'My question'};
 const before=JSON.stringify(personal);const example=seedDiary(today);
 example.periods.push('2026-11-16');seedDiary(today);
 assert.equal(JSON.stringify(personal),before);
 for(const confirmation of ['complete','unsure'] as const)assert.equal(setPeriods({...seed,confirmation},seed.periods.slice(1)).confirmation,'unconfirmed');
});
test('local records round trip, corrupt records and duplicates rejected',()=>{
 assert.deepEqual(parseDiary(JSON.stringify(seed)),seed);
 assert.throws(()=>parseDiary('{bad'));assert.throws(()=>parseDiary('{}'));
 assert.throws(()=>parseDiary(JSON.stringify({...seed,periods:[...seed.periods,seed.periods[0]]})));
 assert.throws(()=>parseDiary(JSON.stringify({...seed,eligibility:{}})));
});
