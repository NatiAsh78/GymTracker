const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let draft = null;
let draftKey = null;
let saving = false;
let activePanel = 'workout';
let flash = '';
let historyWarning = '';
function notice(message, danger = false) {
  const box = document.getElementById('appNotice');
  box.textContent = message;
  box.className = `app-notice ${danger?'rec-danger':'rec-good'} ${message?'':'hidden'}`;
}
function persistDraft() {
  if (!draft || !draftKey) return;
  try { localStorage.setItem(draftKey, JSON.stringify(draft)); }
  catch (err) { console.warn('Draft persistence failed',err); notice('לא ניתן לשמור טיוטה במכשיר. השאר את האפליקציה פתוחה עד לשמירת האימון.',true); }
}
function newDraft(type = null) {
  return {version:PROGRAM_VERSION,requestId:crypto.randomUUID(),type,date:localToday(),bodyWeight:'',bodyFat:'',note:'',rating:'',entries:{}};
}
function restoreDraft(userId) {
  draftKey = `gymtracker:${PROGRAM_VERSION}:${userId}:draft`;
  try {
    const stored = JSON.parse(localStorage.getItem(draftKey) || 'null');
    if (stored && stored.version === PROGRAM_VERSION && ['A','B',null].includes(stored.type) && stored.entries && typeof stored.entries === 'object') {
      // A response can be lost after the transaction committed. Do not restore a saved workout as a new one.
      if (!historyCache.some(s => s.clientRequestId === stored.requestId)) { draft=stored; return; }
      localStorage.removeItem(draftKey);
    }
  } catch (err) { console.warn('Draft recovery failed',err); }
  draft = newDraft();
}
function suggestedType() {
  const last = historyCache.filter(s => s.programVersion === PROGRAM_VERSION && ['A','B'].includes(s.workoutType))
    .slice().sort((a,b) => b.date.localeCompare(a.date) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))[0];
  return last?.workoutType === 'A' ? 'B' : 'A';
}
function selectPanel(name) {
  activePanel=name;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active',t.dataset.tab===name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active',p.id===`panel-${name}`));
  if (name==='history') renderHistory();
}
function renderWorkout() {
  const panel=document.getElementById('panel-workout');
  if(flash){notice(flash);flash='';}
  if (!draft.type) {
    const proposed=suggestedType();
    panel.innerHTML=`<div class="top-card chooser"><h1>איזה אימון עושים היום?</h1><p class="section-sub">${historyCache.some(s=>s.programVersion===PROGRAM_VERSION)?'לפי האימון האחרון':'לתחילת התוכנית'} מומלץ אימון ${proposed}. אפשר לבחור את האימון שמתאים לך.</p><div class="choice-grid">${['A','B'].map(type=>`<button class="plan-choice ${type===proposed?'suggested':''}" data-plan="${type}"><strong>${type}</strong><span>${type==='A'?'חזה · גב · כתפיים · בטן':'ידיים · רגליים · גב תחתון'}</span><small>${planExercises(type).length} תרגילים · ${planExercises(type).reduce((sum,ex)=>sum+ex.sets,0)} סטים${type===proposed?' · מומלץ':''}</small></button>`).join('')}</div></div>`;
    panel.querySelectorAll('[data-plan]').forEach(btn=>btn.addEventListener('click',()=>{draft.type=btn.dataset.plan;persistDraft();renderWorkout();}));
    return;
  }
  const exercises=planExercises(draft.type);
  panel.innerHTML=`<div class="workout-heading"><div><h1>אימון ${draft.type}</h1><p class="section-sub">${exercises.length} תרגילים · ${exercises.reduce((sum,ex)=>sum+ex.sets,0)} סטים · יעד RIR 2 בסט האחרון</p></div><button class="btn btn-secondary" id="changePlan">החלף אימון</button></div>
    <div class="top-card"><div class="meta-grid">
      <div class="field"><label for="sessionDate">תאריך</label><input id="sessionDate" type="date" value="${escapeHtml(draft.date)}"></div>
      <div class="field"><label for="bodyWeight">משקל גוף (ק״ג, לא חובה)</label><input id="bodyWeight" type="number" min="0" step="0.1" value="${escapeHtml(draft.bodyWeight)}"></div>
      <div class="field"><label for="bodyFat">אחוז שומן (לא חובה)</label><input id="bodyFat" type="number" min="0" max="70" step="0.1" value="${escapeHtml(draft.bodyFat)}"></div></div></div>
    <div class="progress-card"><div><div class="progress-title">התקדמות באימון</div><div class="progress-value" id="progressValue"></div><small id="progressDetails"></small></div><div class="progress-bar" role="progressbar" aria-label="התקדמות באימון" aria-valuemin="0" aria-valuemax="${exercises.length}"><div class="progress-fill" id="progressFill"></div></div></div>
    <p class="section-sub">מזינים את החזרות וה־RIR של סט העבודה האחרון, ואת המשקל ששימש בכל הסטים. בתרגילים לכל צד מדווחים לפי הצד שהצליח פחות. היעד הבא הוא המלצה בלבד.</p>
    <div class="exercise-list">${exercises.map(renderExerciseCard).join('')}</div>
    <div class="finish-card"><h2>סיכום האימון</h2><div class="finish-grid"><div class="field"><span class="field-title" id="sessionRatingLabel">איך היה האימון? (לא חובה)</span><div class="rating-row" role="group" aria-labelledby="sessionRatingLabel">${[1,2,3,4,5].map(n=>`<button type="button" class="rating-dot ${Number(draft.rating)===n?'selected':''}" data-rating="${n}" aria-label="דירוג ${n} מתוך 5" aria-pressed="${Number(draft.rating)===n}">${n}</button>`).join('')}</div></div><div class="field full"><label for="sessionNote">הערה לאימון</label><textarea id="sessionNote" rows="3">${escapeHtml(draft.note)}</textarea></div></div><div class="save-row"><button class="btn btn-primary" id="saveWorkoutBtn">שמור אימון</button><button class="btn btn-secondary" id="resetWorkoutBtn">נקה טיוטה</button><span class="section-sub">הטיוטה נשמרת אוטומטית במכשיר</span></div></div>`;
  const fields={sessionDate:'date',bodyWeight:'bodyWeight',bodyFat:'bodyFat',sessionNote:'note'};
  Object.entries(fields).forEach(([id,key])=>document.getElementById(id).addEventListener('input',e=>{
    draft[key]=e.target.value;persistDraft();
    if(key==='date') renderWorkout();
  }));
  panel.querySelectorAll('[data-rating]').forEach(button=>button.addEventListener('click',()=>{
    draft.rating=draft.rating===button.dataset.rating?'':button.dataset.rating;
    panel.querySelectorAll('[data-rating]').forEach(choice=>{
      const selected=choice.dataset.rating===draft.rating;
      choice.classList.toggle('selected',selected);
      choice.setAttribute('aria-pressed',String(selected));
    });
    persistDraft();
  }));
  panel.querySelectorAll('.exercise-card').forEach(card=>bindExerciseCard(card));
  document.getElementById('changePlan').addEventListener('click',()=>{
    if(Object.keys(draft.entries).length && !confirm('החלפת האימון תנקה את התרגילים בטיוטה הנוכחית. להמשיך?')) return;
    draft.type=null;draft.entries={};persistDraft();renderWorkout();
  });
  document.getElementById('resetWorkoutBtn').addEventListener('click',()=>{if(confirm('לנקות את טיוטת האימון?')){draft=newDraft();persistDraft();renderWorkout();}});
  document.getElementById('saveWorkoutBtn').addEventListener('click',savePlanWorkout);
  updateProgress();
}
function renderExerciseCard(ex) {
  const entry=draft.entries[ex.id] || {weight:'',reps:'',rir:'',status:'pending'};
  const last=rirHistory(ex.id,historyCache,draft.date)[0];
  const baseline=!last?legacyBaseline(ex,historyCache,draft.date):null;
  const goal=nextGoal(ex,historyCache,draft.date);
  const goalValue=goal.weight===null ? `${goal.reps} חזרות · בחר משקל` : `${goal.weight} ${ex.weightLabel} × ${goal.reps} חזרות`;
  return `<article class="exercise-card ${entry.status==='completed'?'completed':entry.status==='skipped'?'skipped':''}" data-exercise="${ex.id}">
    <div class="exercise-card-head"><div><span class="exercise-group">${ex.group}</span><h2>${ex.nameHe}</h2><div class="exercise-english" dir="ltr">${ex.name}</div></div><span class="prescription">${ex.sets} סטים${ex.unilateral?' לכל צד':''}<br>${ex.min}–${ex.max} חזרות${ex.unilateral?' לכל צד':''}</span></div>
    ${ex.warmup?'<p class="warmup-note">חימום: 2–3 סטים לפני לחיצת החזה, ללא צורך בדיווח.</p>':''}
    <div class="info-grid"><div class="info-box previous-box"><div class="info-title">${baseline?'נתון קודם מהתרגיל התואם':'הביצוע האחרון בתוכנית החדשה'}</div><div class="info-main">${last?`${last.weight} ${ex.weightLabel} × ${last.reps} · RIR ${last.rir}`:baseline?`${baseline.sourceWeight} ${baseline.sourceWeightLabel} × ${baseline.reps} · RPE ${baseline.rpe}`:'עדיין אין ביצוע'}</div><div class="info-note">${last?fmtDate(last.date):baseline?`${fmtDate(baseline.date)} · התוכנית הקודמת`:'האימון הראשון יגדיר את נקודת ההתחלה.'}</div></div><div class="info-box goal-box"><div class="info-title">היעד לאימון הזה</div><div class="info-main">${goalValue}</div><div class="info-note">${goal.text}</div></div></div>
    <div class="entry-grid"><div class="entry-field"><label for="weight-${ex.id}">${ex.weightLabel}</label><input id="weight-${ex.id}" data-field="weight" class="number-input" type="number" min="0" step="0.5" inputmode="decimal" value="${escapeHtml(entry.weight)}" placeholder="${goal.weight??(ex.allowZero?'0':'משקל')}"></div><div class="entry-field"><label for="reps-${ex.id}">חזרות בסט האחרון</label><input id="reps-${ex.id}" data-field="reps" class="number-input" type="number" min="1" step="1" inputmode="numeric" value="${escapeHtml(entry.reps)}" placeholder="${goal.reps}"></div><div class="entry-field"><label for="rir-${ex.id}">RIR בסט האחרון</label><input id="rir-${ex.id}" data-field="rir" class="number-input" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(entry.rir)}" placeholder="2"></div></div>
    ${ex.allowZero?'<p class="info-note">ללא משקל נוסף? הזן 0.</p>':''}
    <div class="live-rec rec-neutral" data-feedback role="status" aria-live="polite">${entry.status==='skipped'?'התרגיל סומן כדולג.':'RIR = מספר החזרות הנוספות שיכולת לבצע בטכניקה טובה.'}</div>
    <div class="detail-actions"><button class="btn btn-complete" data-action="complete">${entry.status==='completed'?'✓ הושלם':'סמן כהושלם'}</button><button class="btn btn-secondary" data-action="skip">${entry.status==='skipped'?'בטל דילוג':'דלג על התרגיל'}</button></div></article>`;
}
function bindExerciseCard(card) {
  const ex=planExercise(card.dataset.exercise);
  const feedback=card.querySelector('[data-feedback]');
  const update=()=>{
    const entry=draft.entries[ex.id];
    const error=entryError(ex,entry);
    if(error){feedback.textContent=error;feedback.className='live-rec rec-neutral';return;}
    const temporary={programVersion:PROGRAM_VERSION,date:draft.date,createdAt:'9999',exercises:[{exerciseId:ex.id,weight:Number(entry.weight),reps:Number(entry.reps),rir:Number(entry.rir)}]};
    const recommendation=nextGoal(ex,[temporary,...historyCache],draft.date);
    feedback.textContent=`לאימון הבא: ${recommendation.text}${Number(entry.reps)<ex.min||Number(entry.reps)>ex.max?' הביצוע מחוץ לטווח שנקבע; הוא יישמר כפי שדווח.':''}`;
    feedback.className=`live-rec rec-${recommendation.kind}`;
  };
  card.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{
    const entry=draft.entries[ex.id] ||= {weight:'',reps:'',rir:'',status:'pending'};
    entry[input.dataset.field]=input.value;entry.status='pending';
    card.classList.remove('completed','skipped');
    card.querySelector('[data-action="complete"]').textContent='סמן כהושלם';
    card.querySelector('[data-action="skip"]').textContent='דלג על התרגיל';
    persistDraft();update();updateProgress();
  }));
  card.querySelector('[data-action="complete"]').addEventListener('click',()=>{
    const entry=draft.entries[ex.id] ||= {weight:'',reps:'',rir:'',status:'pending'};
    const error=entryError(ex,entry);
    if(error){feedback.textContent=error;feedback.className='live-rec rec-danger';return;}
    entry.status='completed';card.classList.add('completed');card.classList.remove('skipped');
    card.querySelector('[data-action="complete"]').textContent='✓ הושלם';card.querySelector('[data-action="skip"]').textContent='דלג על התרגיל';
    persistDraft();update();updateProgress();
  });
  card.querySelector('[data-action="skip"]').addEventListener('click',()=>{
    const entry=draft.entries[ex.id] ||= {weight:'',reps:'',rir:'',status:'pending'};
    entry.status=entry.status==='skipped'?'pending':'skipped';
    card.classList.toggle('skipped',entry.status==='skipped');card.classList.remove('completed');
    card.querySelector('[data-action="complete"]').textContent='סמן כהושלם';
    card.querySelector('[data-action="skip"]').textContent=entry.status==='skipped'?'בטל דילוג':'דלג על התרגיל';
    feedback.textContent=entry.status==='skipped'?'התרגיל סומן כדולג.':'אפשר להזין את הביצוע ולהשלים את התרגיל.';
    feedback.className='live-rec rec-neutral';persistDraft();updateProgress();
  });
  if(draft.entries[ex.id]?.status==='completed')update();
}
function updateProgress() {
  const exercises=planExercises(draft.type);
  const completed=exercises.filter(e=>draft.entries[e.id]?.status==='completed').length;
  const skipped=exercises.filter(e=>draft.entries[e.id]?.status==='skipped').length;
  document.getElementById('progressValue').textContent=`${completed} מתוך ${exercises.length} הושלמו`;
  document.getElementById('progressDetails').textContent=`${skipped} דולגו · ${exercises.length-completed-skipped} ממתינים`;
  document.getElementById('progressFill').style.width=`${completed/exercises.length*100}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow',completed);
}
function validDate(value) {return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime()) && new Date(value).toISOString().slice(0,10)===value;}
async function savePlanWorkout() {
  if(saving)return;
  const exercises=planExercises(draft.type).filter(ex=>draft.entries[ex.id]?.status==='completed').map(ex=>{
    const e=draft.entries[ex.id];
    return {exerciseId:ex.id,weight:Number(e.weight),reps:Number(e.reps),rir:Number(e.rir)};
  });
  if(!exercises.length){notice('יש להשלים לפחות תרגיל אחד לפני שמירת האימון.',true);return;}
  if(!validDate(draft.date)){notice('יש להזין תאריך תקין.',true);return;}
  if((draft.bodyWeight!==''&&(!Number.isFinite(Number(draft.bodyWeight))||Number(draft.bodyWeight)<=0)) || (draft.bodyFat!==''&&(!Number.isFinite(Number(draft.bodyFat))||Number(draft.bodyFat)<0||Number(draft.bodyFat)>70))){notice('בדוק את משקל הגוף ואחוז השומן.',true);return;}
  for(const entry of exercises){const error=entryError(planExercise(entry.exerciseId),entry);if(error){notice(error,true);return;}}
  const pending=planExercises(draft.type).filter(ex=>!['completed','skipped'].includes(draft.entries[ex.id]?.status));
  if(pending.length && !confirm(`${pending.length} תרגילים טרם הושלמו. לשמור אימון חלקי עם התרגילים שהושלמו בלבד?`))return;
  const session={date:draft.date,bodyWeight:draft.bodyWeight===''?null:Number(draft.bodyWeight),bodyFat:draft.bodyFat===''?null:Number(draft.bodyFat),note:draft.note.trim(),rating:draft.rating===''?null:Number(draft.rating),programVersion:PROGRAM_VERSION,workoutType:draft.type,clientRequestId:draft.requestId,skippedCodes:planExercises(draft.type).filter(ex=>draft.entries[ex.id]?.status==='skipped').map(ex=>ex.id),exercises};
  persistDraft();saving=true;notice('שומר את האימון…');
  // Freeze the draft while the transaction is pending, including navigation.
  document.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=true);
  try {
    await savePlanSession(session);
    draft=newDraft();persistDraft();flash=historyWarning||'✓ האימון נשמר בהצלחה';renderWorkout();window.scrollTo({top:0,behavior:'smooth'});
  } catch(err) {
    console.error('Atomic workout save failed',err);
    notice(err.code==='PGRST202'?'נדרש להפעיל את קובץ עדכון מסד הנתונים לפני שמירת התוכנית החדשה. הטיוטה נשמרה במכשיר.':'השמירה לא אושרה. הטיוטה נשמרה במכשיר; אפשר לנסות שוב בלי ליצור אימון כפול.',true);
  } finally {saving=false;document.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=false);}
}
function renderHistory() {
  const panel=document.getElementById('panel-history');
  panel.innerHTML=`<div class="history-toolbar"><strong>${historyCache.length} אימונים שמורים</strong><div class="history-actions"><button class="btn btn-secondary" id="importHistory">ייבוא JSON</button><button class="btn btn-secondary" id="exportHistory">ייצוא JSON</button><button class="btn btn-secondary" id="exportExcel">ייצוא Excel</button><button class="btn btn-danger" id="clearHistory">מחק הכל</button></div></div>${historyCache.length?'':'<div class="empty">עדיין אין אימונים שמורים.</div>'}${historyCache.map(session=>{
    const modern=session.programVersion===PROGRAM_VERSION;
    const exs=session.exercises||[];
    return `<details class="history-card"><summary class="history-head"><div><span class="history-badge">${modern?`אימון ${escapeHtml(session.workoutType)}`:'גוף מלא · תוכנית קודמת'}</span><strong>${escapeHtml(fmtDate(session.date))}</strong><div class="history-stats">${exs.length} תרגילים${modern?` · ${(session.skippedCodes||[]).length} דולגו`:' · דיווח RPE'}</div></div><span>פרטים</span></summary><div class="history-content"><div class="history-meta">${session.bodyWeight?`<span>משקל גוף: ${escapeHtml(session.bodyWeight)} ק״ג</span>`:''}${session.bodyFat!==null&&session.bodyFat!==undefined?`<span>שומן: ${escapeHtml(session.bodyFat)}%</span>`:''}${session.rating?`<span>דירוג: ${escapeHtml(session.rating)}/5</span>`:''}</div>${session.note?`<p class="history-note">${escapeHtml(session.note)}</p>`:''}<table class="history-table"><thead><tr><th>תרגיל</th>${modern?'<th>סטים</th>':''}<th>משקל</th><th>חזרות</th><th>${modern?'RIR':'RPE'}</th></tr></thead><tbody>${exs.map(ex=>`<tr><td><strong>${escapeHtml(ex.nameHe||ex.name)}</strong>${ex.recommendation?`<div class="info-note">${escapeHtml(ex.recommendation)}</div>`:""}</td>${modern?`<td>${escapeHtml(ex.sets)}${ex.unilateral?' לכל צד':''}</td>`:''}<td>${escapeHtml(ex.weight??'—')} ${escapeHtml(ex.weightLabel||'ק״ג')}</td><td>${escapeHtml(ex.reps)} ${escapeHtml(ex.repsLabel||'חזרות')}</td><td>${escapeHtml(modern?ex.rir:ex.rpe)}</td></tr>`).join('')}</tbody></table>${modern&&(session.skippedCodes||[]).length?`<p class="info-note">דולגו: ${session.skippedCodes.map(code=>escapeHtml(planExercise(code)?.nameHe||code)).join(' · ')}</p>`:''}</div></details>`;
  }).join('')}`;
  document.getElementById('importHistory').addEventListener('click',importJSON);
  document.getElementById('exportHistory').addEventListener('click',exportJSON);
  document.getElementById('exportExcel').addEventListener('click',exportExcel);
  document.getElementById('clearHistory').addEventListener('click',clearHistory);
}
async function bootPlanApp(session) {
  const panel=document.getElementById('panel-workout');
  try {await loadExercises();await loadHistoryFromSupabase();}
  catch(err){console.error('App data load failed',err);panel.innerHTML='<div class="empty">טעינת הנתונים נכשלה. בדוק חיבור לאינטרנט ורענן את העמוד.</div>';selectPanel('workout');return;}
  document.querySelector('nav').classList.remove('hidden');document.getElementById('logoutBtn').classList.remove('hidden');
  restoreDraft(session.user.id);renderWorkout();selectPanel('workout');
}
async function initPlanApp() {
  document.getElementById('headerDate').textContent=fmtDate(localToday());
  document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>selectPanel(tab.dataset.tab)));
  document.getElementById('logoutBtn').addEventListener('click',async()=>{persistDraft();try{await signOut();location.reload();}catch(err){console.error(err);notice('ההתנתקות נכשלה. נסה שוב.',true);}});
  let session;
  try {session=await getSession();}
  catch(err){console.error(err);notice('בדיקת ההתחברות נכשלה. אפשר לנסות להתחבר שוב.',true);}
  if(session){await bootPlanApp(session);return;}
  selectPanel('login');
  document.getElementById('panel-login').innerHTML='<form class="top-card login-card" id="loginForm"><h1>התחברות</h1><div class="field"><label for="loginEmail">אימייל</label><input id="loginEmail" type="email" autocomplete="username" required></div><div class="field"><label for="loginPassword">סיסמה</label><input id="loginPassword" type="password" autocomplete="current-password" required></div><button class="btn btn-primary" type="submit">התחבר</button></form>';
  document.getElementById('loginForm').addEventListener('submit',async e=>{
    e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;
    try{await signIn(document.getElementById('loginEmail').value.trim(),document.getElementById('loginPassword').value);const current=await getSession();if(!current)throw new Error('No session');notice('');await bootPlanApp(current);}
    catch(err){console.error('Sign-in failed',err);notice('ההתחברות נכשלה. בדוק אימייל וסיסמה וחיבור לאינטרנט.',true);}
    finally{button.disabled=false;}
  });
}
initPlanApp();


