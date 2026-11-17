import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { SummaryDocument } from '../components/visit-summary';
import { emptyDiary } from '../lib/diary';
test('actual print document excludes private notes from rendered markup and retains fictional label',()=>{
 const diary={...emptyDiary(),notes:[{id:'older',date:'2026-11-15',text:'PRIVATE_LEGACY_SENTINEL'}],entries:[{date:'2026-11-16',symptoms:['Headache'],note:'PRIVATE_DAILY_SENTINEL',cramps:'mild' as const}],questions:'Appointment question'};
 const excluded=renderToStaticMarkup(<SummaryDocument diary={diary} today="2026-11-16" range="all" includeNotes={false} example/>);
 assert.equal(excluded.includes('PRIVATE_'),false);assert.ok(excluded.includes('Fictional example'));assert.ok(excluded.includes('Headache'));assert.ok(excluded.includes('Mild'));assert.ok(excluded.includes('days logged'));assert.ok(excluded.includes('Appointment question'));
 const included=renderToStaticMarkup(<SummaryDocument diary={diary} today="2026-11-16" range="all" includeNotes example/>);
 assert.ok(included.includes('PRIVATE_LEGACY_SENTINEL'));assert.ok(included.includes('PRIVATE_DAILY_SENTINEL'));
});
test('summary reports exact completeness denominator, self-confirmation, and optional daily impact',()=>{
 const diary={...emptyDiary(),confirmation:'complete' as const,entries:[{date:'2026-11-16',note:'',symptoms:[],impact:{sleep:true,studyWork:false}}]};
 const html=renderToStaticMarkup(<SummaryDocument diary={diary} today="2026-11-16" range="90" includeNotes/>);
 assert.ok(html.includes('of 90 days logged'));assert.ok(html.includes('Dates confirmed by you.'));
 assert.ok(html.includes('Sleep'));assert.ok(html.includes('Affected'));assert.ok(html.includes('Not affected'));
 assert.ok(html.includes('19 Aug 2026'));assert.ok(html.includes('16 Nov 2026'));
 assert.equal(html.includes('Usual activities'),false);
 assert.equal(html.includes('Mean recorded interval'),false);
});
