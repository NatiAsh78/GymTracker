// In-memory cache of all workout history, loaded once from Supabase at
// startup (see loadHistoryFromSupabase). Every recommendation calculation
// reads from this cache instead of hitting the network — getGoal() and
// currentRecommendation() run on every keystroke, and Supabase round-trips
// on every keystroke would make the app feel laggy.
let historyCache=[];

function transformSession(row){
  return {
    id:row.id,
    date:row.workout_date,
    bodyWeight:row.body_weight,
    bodyFat:row.body_fat,
    note:row.notes||'',
    rating:row.rating,
    programVersion:row.program_version||null,
    workoutType:row.workout_type||null,
    clientRequestId:row.client_request_id||null,
    createdAt:row.created_at||'',
    skippedCodes:row.skipped_codes||[],
    exercises:(row.exercise_logs||[]).map(log=>{
      const ex=log.exercises||{};
      const meta=MUSCLE_GROUPS[ex.muscle_group];
      return {
        exerciseId:ex.code,
        groupId:ex.muscle_group,
        name:ex.name,
        nameHe:ex.name_he,
        muscle:meta?meta.name:ex.muscle_group,
        weight:log.weight,
        reps:log.reps,
        rpe:log.rpe,
        rir:log.rir===null||log.rir===undefined?null:Number(log.rir),
        sets:log.prescribed_sets,
        minReps:log.rep_min,
        maxReps:log.rep_max,
        unilateral:log.unilateral||false,
        weightLabel:ex.weight_label||'ק״ג',
        repsLabel:ex.reps_label||'חזרות',
        recommendation:log.recommendation||''
      };
    })
  };
}

async function loadHistoryFromSupabase(){
  const {data,error}=await supabaseClient
    .from('workout_sessions')
    .select('*, exercise_logs(*, exercises(*))')
    .order('workout_date',{ascending:false})
    .order('id',{ascending:false});
  if(error)throw error;
  historyCache=data.map(transformSession);
}

function getExerciseHistory(exerciseId){
  const rows=[];
  historyCache.forEach(session=>{
    (session.exercises||[]).forEach(ex=>{
      if(ex.exerciseId===exerciseId){
        rows.push({...ex,date:session.date,sessionId:session.id});
      }
    });
  });
  return rows.sort((a,b)=>{
    const d=new Date(b.date)-new Date(a.date);
    return d!==0?d:(b.sessionId||0)-(a.sessionId||0);
  });
}

// session: {date, bodyWeight, bodyFat, note, rating, exercises:[{exerciseId, weight, reps, rpe, recommendation}]}
async function saveSession(session){
  if(session.programVersion===PROGRAM_VERSION)return savePlanSession(session);
  const {data:sessionRow,error:sessErr}=await supabaseClient
    .from('workout_sessions')
    .insert({
      workout_date:session.date,
      body_weight:session.bodyWeight,
      body_fat:session.bodyFat,
      notes:session.note||null,
      rating:session.rating
    })
    .select()
    .single();
  if(sessErr)throw sessErr;

  const logs=session.exercises.map(e=>{
    const ex=exerciseById(e.exerciseId);
    return {
      workout_session_id:sessionRow.id,
      exercise_id:ex.dbId,
      weight:e.weight,
      reps:e.reps,
      rpe:e.rpe,
      recommendation:e.recommendation||null
    };
  });
  const {error:logErr}=await supabaseClient.from('exercise_logs').insert(logs);
  if(logErr)throw logErr;

  await loadHistoryFromSupabase();
}

function toggleHistory(id){document.getElementById(`history-${id}`)?.classList.toggle('open')}

async function clearHistory(){
  if(!confirm('למחוק את כל היסטוריית האימונים?'))return;
  try{
    const {data:sessions,error:fetchErr}=await supabaseClient.from('workout_sessions').select('id');
    if(fetchErr)throw fetchErr;
    const ids=sessions.map(s=>s.id);
    if(ids.length){
      const {error:delLogsErr}=await supabaseClient.from('exercise_logs').delete().in('workout_session_id',ids);
      if(delLogsErr)throw delLogsErr;
      const {error:delSessErr}=await supabaseClient.from('workout_sessions').delete().in('id',ids);
      if(delSessErr)throw delSessErr;
    }
    historyCache=[];
    renderHistory();
  }catch(err){
    console.error('clearHistory failed:',err);
    alert('מחיקת ההיסטוריה נכשלה. בדוק את החיבור לאינטרנט ונסה שוב.');
  }
}

function exportJSON(){
  const blob=new Blob([JSON.stringify(historyCache,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`gym-history-${todayStr()}.json`;a.click();URL.revokeObjectURL(url);
}

function sessionFingerprint(session){
  return JSON.stringify({date:session.date,version:session.programVersion||null,type:session.workoutType||null,
    bodyWeight:session.bodyWeight??null,bodyFat:session.bodyFat??null,note:session.note||'',rating:session.rating??null,
    skipped:(session.skippedCodes||[]).slice().sort(),
    exercises:(session.exercises||[]).map(e=>[e.exerciseId,Number(e.weight??0),Number(e.reps),Number(e.rpe??0),e.rir??null]).sort((a,b)=>a[0].localeCompare(b[0]))});
}

async function importJSON(){
  const input=document.createElement('input');
  input.type='file';input.accept='.json,application/json';
  input.onchange=e=>{
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=async ev=>{
      try{
        const incoming=JSON.parse(ev.target.result);
        if(!Array.isArray(incoming))throw new Error();
        if(incoming.some(s=>!s || !validDate(s.date) || !Array.isArray(s.exercises)))throw new Error('Invalid session structure');
        const existingKeys=new Set(historyCache.map(sessionFingerprint));
        let imported=0;
        for(const session of incoming){
          const key=sessionFingerprint(session);
          if(existingKeys.has(key))continue;
          const exercises=(session.exercises||[])
            .filter(ex=>ex.exerciseId&&exerciseById(ex.exerciseId))
            .map(ex=>({
              exerciseId:ex.exerciseId,
              weight:ex.weight??0,
              reps:ex.reps,
              rpe:ex.rpe??0,
              rir:ex.rir??null,
              recommendation:ex.recommendation||''
            }));
          if(!exercises.length)continue;
          if(exercises.length!==session.exercises.length)throw new Error('Unknown exercise; refusing partial import');
          if(session.programVersion===PROGRAM_VERSION){
            if(!['A','B'].includes(session.workoutType) || exercises.some(e=>!planExercise(e.exerciseId)||planExercise(e.exerciseId).type!==session.workoutType||entryError(planExercise(e.exerciseId),e)))throw new Error('Invalid A/B workout');
          }
          await saveSession({
            date:session.date,
            bodyWeight:session.bodyWeight??null,
            bodyFat:session.bodyFat??null,
            note:session.note||'',
            rating:session.rating??null,
            programVersion:session.programVersion||null,
            workoutType:session.workoutType||null,
            clientRequestId:session.clientRequestId||crypto.randomUUID(),
            skippedCodes:session.skippedCodes||[],
            exercises
          });
          imported++;
          existingKeys.add(key);
        }
        alert(`נוספו ${imported} אימונים חדשים.`);
        renderHistory();
      }catch(err){
        console.error('importJSON failed:',err);
        alert('הקובץ אינו קובץ JSON תקין של האפליקציה, או שהייבוא נכשל.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function exportExcel(){
  const history=[...historyCache].sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(!history.length){alert('אין נתונים לייצוא');return}
  const rows=[];
  history.forEach(session=>{
    (session.exercises||[]).forEach(ex=>{
      rows.push({
        'תאריך':session.date,
        'קבוצת שרירים':ex.muscle||ex.groupId||'',
        'תרגיל':ex.name||'',
        'שם עברית':ex.nameHe||'',
        'משקל':ex.weight??'',
        'חזרות/זמן':ex.reps??'',
        'יחידה':ex.repsLabel||'',
        'RPE':ex.rpe??'',
        'RIR':ex.rir??'',
        'אימון':session.workoutType||'גוף מלא',
        'תוכנית':session.programVersion||'קודמת',
        'סטים':ex.sets??'',
        'לכל צד':ex.unilateral?'כן':'',
        'יחידת משקל':ex.weightLabel||'ק״ג',
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
    ws['!cols']=Object.keys(rows[0]).map(key=>({wch:key==='המלצה'||key==='הערה'?45:key==='תרגיל'||key==='שם עברית'?28:16}));
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
