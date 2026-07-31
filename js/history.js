const STORAGE_KEY='gym_history_v1';

function loadHistory(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}
  catch{return []}
}
function saveHistory(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}

function getExerciseHistory(exerciseId){
  const rows=[];
  loadHistory().forEach(session=>{
    (session.exercises||[]).forEach(raw=>{
      const ex=normalizeLegacyExercise(raw);
      if(ex.exerciseId===exerciseId && ex.completed!==false){
        rows.push({...ex,date:session.date,sessionId:session.id});
      }
    });
  });
  return rows.sort((a,b)=>{
    const d=new Date(b.date)-new Date(a.date);
    return d!==0?d:(b.sessionId||0)-(a.sessionId||0);
  });
}

function toggleHistory(id){document.getElementById(`history-${id}`)?.classList.toggle('open')}
function clearHistory(){
  if(confirm('למחוק את כל היסטוריית האימונים?')){
    localStorage.removeItem(STORAGE_KEY);renderHistory();
  }
}
function exportJSON(){
  const blob=new Blob([JSON.stringify(loadHistory(),null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`gym-history-${todayStr()}.json`;a.click();URL.revokeObjectURL(url);
}
function importJSON(){
  const input=document.createElement('input');
  input.type='file';input.accept='.json,application/json';
  input.onchange=e=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try{
        const incoming=JSON.parse(ev.target.result);
        if(!Array.isArray(incoming))throw new Error();
        const existing=loadHistory(),ids=new Set(existing.map(s=>s.id));
        const fresh=incoming.filter(s=>!ids.has(s.id));
        saveHistory([...existing,...fresh]);
        alert(`נוספו ${fresh.length} אימונים חדשים.`);
        renderHistory();
      }catch{alert('הקובץ אינו קובץ JSON תקין של האפליקציה.')}
    };
    reader.readAsText(file);
  };
  input.click();
}
function exportExcel(){
  const history=loadHistory().sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!history.length){alert('אין נתונים לייצוא');return}
  const rows=[];
  history.forEach(session=>{
    (session.exercises||[]).forEach(raw=>{
      const ex=normalizeLegacyExercise(raw);
      rows.push({
        'תאריך':session.date,
        'קבוצת שרירים':ex.muscle||ex.groupId||'',
        'תרגיל':ex.name||'',
        'שם עברית':ex.nameHe||'',
        'משקל':ex.weight??'',
        'חזרות/זמן':ex.reps??'',
        'יחידה':ex.repsLabel||'',
        'RPE':ex.rpe??'',
        'המלצה':ex.recommendation||'',
        'משקל גוף':session.bodyWeight??'',
        'שומן גוף':session.bodyFat??'',
        'דירוג אימון':session.rating??'',
        'הערה':session.note||''
      });
    });
  });
  if(typeof XLSX!=='undefined'){
    const ws=XLSX.utils.json_to_sheet(rows);
    ws['!cols']=[{wch:12},{wch:18},{wch:25},{wch:24},{wch:10},{wch:12},{wch:10},{wch:7},{wch:45},{wch:12},{wch:12},{wch:12},{wch:30}];
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'אימונים');
    XLSX.writeFile(wb,`gym-history-${todayStr()}.xlsx`);
  }else{
    const headers=Object.keys(rows[0]),esc=v=>`"${String(v).replace(/"/g,'""')}"`;
    const csv='﻿'+[headers.map(esc).join(','),...rows.map(r=>headers.map(h=>esc(r[h])).join(','))].join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`gym-history-${todayStr()}.csv`;a.click();URL.revokeObjectURL(url);
  }
}
