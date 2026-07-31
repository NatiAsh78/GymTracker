let workoutState={};
let currentGroupId=null;

function readCurrentEntry(){
  const state=workoutState[currentGroupId];
  const ex=exerciseById(state.exerciseId);
  return {
    ex,
    weight:ex.noWeight?0:Number(document.getElementById('currentWeight')?.value||0),
    reps:Number(document.getElementById('currentReps')?.value||0),
    rpe:Number(document.getElementById('currentRpe')?.value||0)
  };
}

function updateLiveRecommendation(){
  const {ex,weight,reps,rpe}=readCurrentEntry();
  const rec=currentRecommendation(ex,{weight,reps,rpe});
  const box=document.getElementById('liveRec');
  box.textContent=rec.text;
  box.className=`live-rec ${rec.cls}`;
}

function finishGroup(markCompleted){
  const {ex,weight,reps,rpe}=readCurrentEntry();
  if(!reps){
    alert(`יש להזין ${ex.repsLabel||'מספר חזרות'}.`);return;
  }
  if(markCompleted){
    if(!ex.noWeight && weight<=0){alert('יש להזין משקל.');return}
    if(rpe<1||rpe>10){alert('יש להזין RPE בין 1 ל־10.');return}
  }

  const rec=currentRecommendation(ex,{weight,reps,rpe});
  workoutState[currentGroupId]={
    exerciseId:ex.id,
    weight,
    reps,
    rpe,
    recommendation:rec.text,
    completed:markCompleted
  };
  returnToDashboard();
}

function returnToDashboard(){
  document.getElementById('detailView').classList.remove('active');
  document.getElementById('dashboardView').classList.remove('hidden');
  currentGroupId=null;
  updateDashboard();
  window.scrollTo({top:0,behavior:'smooth'});
}

async function saveWorkout(){
  const completedGroups=GROUPS.filter(g=>workoutState[g.id]?.completed);
  if(!completedGroups.length){
    alert('עדיין לא הושלם אף תרגיל.');return;
  }

  const exercises=completedGroups.map(group=>{
    const state=workoutState[group.id];
    const ex=exerciseById(state.exerciseId);
    return {
      exerciseId:ex.id,
      weight:ex.noWeight?0:Number(state.weight),
      reps:Number(state.reps),
      rpe:Number(state.rpe),
      recommendation:state.recommendation||''
    };
  });

  const ratingBtn=document.querySelector('.rating-dot.selected');
  const session={
    date:document.getElementById('sessionDate').value||todayStr(),
    bodyWeight:Number(document.getElementById('bodyWeight').value)||null,
    bodyFat:Number(document.getElementById('bodyFat').value)||null,
    note:document.getElementById('sessionNote').value.trim(),
    rating:ratingBtn?Number(ratingBtn.dataset.value):null,
    exercises
  };

  const saveBtn=document.getElementById('saveWorkoutBtn');
  saveBtn.disabled=true;
  try{
    await saveSession(session);
  }catch(err){
    console.error('saveWorkout failed:',err);
    alert('שמירת האימון נכשלה. בדוק את החיבור לאינטרנט ונסה שוב.');
    saveBtn.disabled=false;
    return;
  }

  const msg=document.getElementById('saveMessage');
  msg.classList.add('show');
  setTimeout(()=>{
    workoutState={};
    renderWorkout();
    window.scrollTo({top:0,behavior:'smooth'});
  },900);
}
