'use client';
import { useEffect, useState } from 'react';
import { emptyDiary, todayISO, type Diary } from '@/lib/diary';
import { loadDiary, saveDiary, type DiaryMode } from '@/lib/storage';

export function useDiary(mode: DiaryMode) {
  const [data,setData]=useState<Diary>(emptyDiary);
  const [today,setToday]=useState('');
  const [ready,setReady]=useState(false);
  const [unreadable,setUnreadable]=useState(false);
  useEffect(()=>{
    let active=true;
    queueMicrotask(()=>{
      if(!active)return;
      const date=todayISO();setToday(date);
      try { setData(loadDiary(localStorage,mode,date));setUnreadable(false); }
      catch { setUnreadable(true); }
      setReady(true);
    });
    const updateToday=()=>setToday(todayISO());
    window.addEventListener('focus',updateToday);
    const clock=setInterval(updateToday,60_000);
    return()=>{active=false;clearInterval(clock);window.removeEventListener('focus',updateToday);};
  },[mode]);
  function commit(next:Diary,replace=false):boolean {
    if(!ready||(unreadable&&!replace))return false;
    try { saveDiary(localStorage,mode,next); }
    catch {return false;}
    setData(next);setUnreadable(false);return true;
  }
  return {data,today,ready,unreadable,commit};
}
