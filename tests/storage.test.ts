import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyDiary, seedDiary } from '../lib/diary';
import { deletePersonalDiary, loadDiary, resetExample, saveDiary } from '../lib/storage';
function memoryStorage() {
  const entries = new Map<string,string>();
  return {
    getItem: (key:string) => entries.get(key) ?? null,
    setItem: (key:string,value:string) => { entries.set(key,value); },
    removeItem: (key:string) => { entries.delete(key); },
  };
}
test('fresh personal diary is empty; fictional example loads separately',()=>{
  const storage=memoryStorage();
  assert.deepEqual(loadDiary(storage,'personal','2026-11-16'),emptyDiary());
  assert.deepEqual(loadDiary(storage,'example','2026-11-16'),seedDiary('2026-11-16'));
});
test('save and reload preserve personal entries, context, uncertainty, and questions',()=>{
  const storage=memoryStorage();
  const personal={...emptyDiary(),periods:['2026-11-01'],notes:[{id:'test',date:'2026-11-01',text:'Fictional test note'}],confirmation:'unsure' as const,questions:'Fictional test question'};
  saveDiary(storage,'personal',personal);
  assert.deepEqual(loadDiary(storage,'personal','2026-11-16'),personal);
});
test('opening and resetting example cannot alter stored personal data; delete is isolated',()=>{
 const storage=memoryStorage();
 const personal={...emptyDiary(),periods:['2026-10-10'],questions:'Fictional personal test'};
 saveDiary(storage,'personal',personal);
 const raw=storage.getItem('ritusaathi.personal.v1');
 saveDiary(storage,'example',loadDiary(storage,'example','2026-11-16'));
 resetExample(storage,'2026-11-17');
 assert.equal(storage.getItem('ritusaathi.personal.v1'),raw);
 assert.deepEqual(loadDiary(storage,'personal','2026-11-17'),personal);
 const fictionalRaw=storage.getItem('ritusaathi.example.v1');
 deletePersonalDiary(storage);
 assert.equal(storage.getItem('ritusaathi.personal.v1'),null);
 assert.equal(storage.getItem('ritusaathi.example.v1'),fictionalRaw);
});
test('corrupt storage is rejected without overwriting it',()=>{
 const storage=memoryStorage();storage.setItem('ritusaathi.personal.v1','broken');
 assert.throws(()=>loadDiary(storage,'personal','2026-11-16'));
 assert.equal(storage.getItem('ritusaathi.personal.v1'),'broken');
});
