async function savePlanSession(session) {
  const {data,error}=await supabaseClient.rpc('save_ab_workout',{payload:session});
  if(error)throw error;
  try{await loadHistoryFromSupabase();historyWarning='';}
  catch(err){
    console.warn('Saved workout; history refresh failed',err);
    historyWarning='✓ האימון נשמר. רענון ההיסטוריה מהענן נכשל; מוצג עותק מקומי.';
    const enriched={...session,id:data,createdAt:new Date().toISOString(),exercises:session.exercises.map(e=>({...e,...planSnapshot(planExercise(e.exerciseId))}))};
    if(!historyCache.some(s=>s.clientRequestId===session.clientRequestId))historyCache.unshift(enriched);
  }
}
function planSnapshot(ex){return {name:ex.name,nameHe:ex.nameHe,muscle:ex.group,sets:ex.sets,minReps:ex.min,maxReps:ex.max,weightLabel:ex.weightLabel,repsLabel:'חזרות',unilateral:!!ex.unilateral};}
