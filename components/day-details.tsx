import { type Day, hasObservation } from '@/lib/daily';
import { d } from '@/lib/daily-strings';
import { s, formatDate } from '@/lib/strings';
export function DayDetails({day,includeNotes=true}:{day:Day;includeNotes?:boolean}) {
 if(!hasObservation(day))return <p>{d.nothingDay}</p>;
 return <div className="day-observations">
 {day.periodStart&&<p className="recorded-start"><span aria-hidden="true">◆</span> {s.periodStart}</p>}
 <dl className="observation-values"><div><dt>{d.flow}</dt><dd>{day.flow?d.flows[day.flow]:d.unknown}</dd></div><div><dt>{d.cramps}</dt><dd>{day.cramps!==undefined?d.crampLevels[day.cramps]:d.unknown}</dd></div></dl>
 {day.symptoms.length>0&&<p className="symptom-text">{day.symptoms.join(' · ')}</p>}
 {includeNotes&&day.note&&<p className="preserve diary-note">{day.note}</p>}
 {includeNotes&&day.legacyNotes.map(note=><p className="preserve diary-note" key={note.id}>{note.text}</p>)}
 </div>;
}
export function DayMarkers({day}:{day:Day}){
 return <span className="day-markers" aria-hidden="true">{day.periodStart&&<span className="start-marker">◆</span>}{day.flow&&<span className="flow-marker">━</span>}{(day.symptoms.length>0||day.note||day.legacyNotes.length>0||day.cramps!==undefined)&&<span className="note-marker">●</span>}</span>;
}
export function dayLabel(day:Day){
 return `${formatDate(day.date)}${day.periodStart?`, ${d.startMarker}`:''}${day.flow?`, ${d.flow}: ${d.flows[day.flow]}`:''}${day.cramps!==undefined?`, ${d.cramps}: ${d.crampLevels[day.cramps]}`:''}${day.symptoms.length||day.note||day.legacyNotes.length?`, ${d.noteMarker}`:''}`;
}
