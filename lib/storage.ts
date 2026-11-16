import { type Diary, emptyDiary, parseDiary, seedDiary } from './diary';
export type DiaryMode = 'personal' | 'example';
export type DiaryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
const keys: Record<DiaryMode, string> = {
  personal: 'ritusaathi.personal.v1',
  example: 'ritusaathi.example.v1',
};
export function loadDiary(storage: DiaryStorage, mode: DiaryMode, today: string): Diary {
  const raw = storage.getItem(keys[mode]);
  return raw === null ? (mode === 'example' ? seedDiary(today) : emptyDiary()) : parseDiary(raw);
}
export function saveDiary(storage: DiaryStorage, mode: DiaryMode, diary: Diary): void {
  storage.setItem(keys[mode], JSON.stringify(diary));
}
export function resetExample(storage: DiaryStorage, today: string): Diary {
  const fresh = seedDiary(today);
  saveDiary(storage, 'example', fresh);
  return fresh;
}
export function deletePersonalDiary(storage: DiaryStorage): void {
  storage.removeItem(keys.personal);
}
