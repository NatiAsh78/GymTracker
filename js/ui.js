function renderLoginForm(onSubmit){
  document.querySelector('nav').classList.add('hidden');
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const panel=document.getElementById('panel-login');
  panel.classList.add('active');
  panel.innerHTML=`
    <div class="top-card" style="max-width:360px;margin:60px auto 0">
      <div class="section-title" style="margin-top:0">התחברות</div>
      <div class="field">
        <label>אימייל</label>
        <input id="loginEmail" type="email" autocomplete="username">
      </div>
      <div class="field" style="margin-top:12px">
        <label>סיסמה</label>
        <input id="loginPassword" type="password" autocomplete="current-password">
      </div>
      <div class="live-rec rec-danger hidden" id="loginError" style="margin-top:14px"></div>
      <button class="btn btn-primary" id="loginSubmitBtn" style="width:100%;margin-top:16px">התחבר</button>
    </div>
  `;

  const submit=async()=>{
    const email=document.getElementById('loginEmail').value.trim();
    const password=document.getElementById('loginPassword').value;
    const errBox=document.getElementById('loginError');
    const btn=document.getElementById('loginSubmitBtn');
    errBox.classList.add('hidden');
    btn.disabled=true;
    try{
      await onSubmit(email,password);
    }catch(err){
      console.error('login failed:',err);
      errBox.textContent='התחברות נכשלה. בדוק אימייל וסיסמה.';
      errBox.classList.remove('hidden');
      btn.disabled=false;
    }
  };
  document.getElementById('loginSubmitBtn').addEventListener('click',submit);
  document.getElementById('loginPassword').addEventListener('keydown',e=>{
    if(e.key==='Enter')submit();
  });
}

function showApp(){
  document.querySelector('nav').classList.remove('hidden');
  document.getElementById('logoutBtn')?.classList.remove('hidden');
}

function renderWorkout(){
  const panel=document.getElementById('panel-workout');
  panel.innerHTML=`
    <div class="dashboard-view" id="dashboardView">
      <div class="top-card">
        <div class="meta-grid">
          <div class="field">
            <label>תאריך</label>
            <input id="sessionDate" type="date" value="${todayStr()}">
          </div>
          <div class="field">
            <label>משקל גוף (ק"ג)</label>
            <input id="bodyWeight" type="number" step="0.1" min="0" placeholder="לא חובה">
          </div>
          <div class="field">
            <label>אחוז שומן</label>
            <input id="bodyFat" type="number" step="0.1" min="0" max="70" placeholder="לא חובה">
          </div>
        </div>
      </div>

      <div class="progress-card">
        <div>
          <div class="progress-title">התקדמות באימון</div>
          <div class="progress-value" id="progressValue">0 מתוך 8</div>
        </div>
        <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
      </div>

      <div class="section-title">קבוצות השרירים</div>
      <div class="section-sub">בחר את הקבוצה הבאה לפי הסדר שנוח לך. בסיום כל תרגיל חוזרים למסך הזה.</div>

      <div class="dashboard" id="dashboard">
        ${GROUPS.map(buildGroupCard).join('')}
      </div>

      <div class="finish-card">
        <div class="finish-title">סיכום האימון</div>
        <div class="finish-sub">מלא בסיום, לפני שמירת האימון.</div>
        <div class="finish-grid">
          <div class="field">
            <span class="field-title">איך היה האימון?</span>
            <div class="rating-row" id="ratingRow">
              ${[1,2,3,4,5].map(n=>`<button type="button" class="rating-dot" data-value="${n}">${n}</button>`).join('')}
            </div>
          </div>
          <div class="field full">
            <label>הערה לאימון</label>
            <textarea id="sessionNote" rows="3" placeholder="איך הרגשת? מה היה קל או קשה? מה כדאי לזכור לפעם הבאה?"></textarea>
          </div>
        </div>
        <div class="save-row">
          <button class="btn btn-primary" id="saveWorkoutBtn">שמור אימון</button>
          <button class="btn btn-secondary" id="resetWorkoutBtn">נקה אימון</button>
          <span class="save-message" id="saveMessage">✓ האימון נשמר</span>
        </div>
      </div>
    </div>

    <div class="detail-view" id="detailView"></div>
  `;

  document.querySelectorAll('.group-card').forEach(card=>{
    card.addEventListener('click',()=>openGroup(card.dataset.group));
  });
  document.querySelectorAll('.rating-dot').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.rating-dot').forEach(x=>x.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });
  document.getElementById('saveWorkoutBtn').addEventListener('click',saveWorkout);
  document.getElementById('resetWorkoutBtn').addEventListener('click',()=>{
    if(confirm('לנקות את נתוני האימון הנוכחי?')){
      workoutState={};renderWorkout();
    }
  });
  updateDashboard();
}

function buildGroupCard(group){
  return `
  <article class="group-card" data-group="${group.id}" id="groupCard-${group.id}"
    style="--group:${group.color};--soft:${group.soft}">
    <div class="group-top">
      <div class="group-id">
        <div class="muscle-illustration">${muscleSvg(group.id)}</div>
        <div>
          <div class="group-name">${group.name}</div>
          <div class="group-count">${group.exercises.length} ${group.exercises.length===1?'תרגיל':'אפשרויות'}</div>
        </div>
      </div>
      <div class="status-badge" id="status-${group.id}">○</div>
    </div>
    <div class="group-summary" id="summary-${group.id}">
      בחר תרגיל והתחל
    </div>
  </article>`;
}

function updateDashboard(){
  let completed=0;
  GROUPS.forEach(group=>{
    const card=document.getElementById(`groupCard-${group.id}`);
    const status=document.getElementById(`status-${group.id}`);
    const summary=document.getElementById(`summary-${group.id}`);
    if(!card||!status||!summary)return;

    card.classList.remove('completed','in-progress');
    const state=workoutState[group.id];
    if(state?.completed){
      completed++;
      card.classList.add('completed');
      status.textContent='✓';
      const ex=exerciseById(state.exerciseId);
      summary.innerHTML=`<strong>${ex.nameHe}</strong> · ${ex.noWeight?'':state.weight+' '+(ex.weightLabel||'ק"ג')+' · '}${state.reps} ${ex.repsLabel||'חזרות'} · RPE ${state.rpe}
      <div class="goal-mini">הושלם</div>`;
    }else if(state?.exerciseId){
      card.classList.add('in-progress');
      status.textContent='•';
      const ex=exerciseById(state.exerciseId);
      const goal=getGoal(state.exerciseId);
      summary.innerHTML=`<strong>${ex.nameHe}</strong><div class="goal-mini">${goal.short}</div>`;
    }else{
      status.textContent='○';
      summary.textContent='בחר תרגיל והתחל';
    }
  });
  document.getElementById('progressValue').textContent=`${completed} מתוך 8`;
  document.getElementById('progressFill').style.width=`${completed/8*100}%`;
}

function openGroup(groupId){
  currentGroupId=groupId;
  const group=groupById(groupId);
  const state=workoutState[groupId]||{};
  const detail=document.getElementById('detailView');
  const dashboard=document.getElementById('dashboardView');

  detail.innerHTML=`
    <button class="back-button" id="backToDashboard">← חזרה לכל קבוצות השרירים</button>
    <div class="detail-card" style="--group:${group.color};--soft:${group.soft}">
      <div class="detail-head">
        <div class="muscle-illustration">${muscleSvg(group.id)}</div>
        <div>
          <div class="detail-title">${group.name}</div>
          <div class="detail-sub">בחר תרגיל, בדוק את היעד להיום והזן את הביצוע.</div>
        </div>
      </div>

      <select class="exercise-select" id="exerciseSelect">
        <option value="">בחר תרגיל...</option>
        ${group.exercises.map(ex=>`<option value="${ex.id}" ${state.exerciseId===ex.id?'selected':''}>${ex.nameHe} · ${ex.name}</option>`).join('')}
      </select>

      <div id="exerciseArea" class="${state.exerciseId?'':'hidden'}"></div>
    </div>
  `;

  dashboard.classList.add('hidden');
  detail.classList.add('active');

  document.getElementById('backToDashboard').addEventListener('click',returnToDashboard);
  document.getElementById('exerciseSelect').addEventListener('change',e=>{
    const exId=e.target.value;
    if(!exId){
      workoutState[groupId]={};
      document.getElementById('exerciseArea').classList.add('hidden');
      return;
    }
    workoutState[groupId]={exerciseId:exId,completed:false};
    renderExerciseArea(groupId);
  });

  if(state.exerciseId)renderExerciseArea(groupId);
}

function renderExerciseArea(groupId){
  const area=document.getElementById('exerciseArea');
  const state=workoutState[groupId];
  const ex=exerciseById(state.exerciseId);
  const history=getExerciseHistory(ex.id);
  const last=history[0];
  const goal=getGoal(ex.id);

  const weightValue=state.weight ?? goal.weight ?? '';
  const repsValue=state.reps ?? goal.reps ?? '';
  const rpeValue=state.rpe ?? '';

  area.classList.remove('hidden');
  area.innerHTML=`
    <div class="info-grid">
      <div class="info-box previous-box">
        <div class="info-title">האימון הקודם בתרגיל זה</div>
        <div class="info-main">
          ${last
            ? `${ex.noWeight?'':`${last.weight} ${ex.weightLabel||'ק"ג'} · `}${last.reps} ${ex.repsLabel||'חזרות'} · RPE ${last.rpe}`
            : 'אין עדיין ביצוע קודם'}
        </div>
        <div class="info-note">${last?fmtDate(last.date):'זה יהיה נתון הבסיס הראשון.'}</div>
      </div>

      <div class="info-box goal-box">
        <div class="info-title">🎯 היעד להיום</div>
        <div class="info-main">${goal.text}</div>
        <div class="info-note">היעד מחושב לפי הביצועים הקודמים של תרגיל זה בלבד.</div>
      </div>
    </div>

    <div class="entry-title">הביצוע היום</div>
    <div class="entry-grid">
      <div class="entry-field ${ex.noWeight?'hidden':''}">
        <label>משקל</label>
        <input class="number-input" id="currentWeight" type="number" step="0.5" min="0" value="${weightValue}">
        <div class="unit">${ex.weightLabel||'ק"ג'}</div>
      </div>
      <div class="entry-field">
        <label>${ex.repsLabel||'חזרות'}</label>
        <input class="number-input" id="currentReps" type="number" step="1" min="1" value="${repsValue}">
        <div class="unit">${ex.repsLabel||'חזרות'}</div>
      </div>
      <div class="entry-field">
        <label>RPE נוכחי</label>
        <input class="number-input" id="currentRpe" type="number" step="1" min="1" max="10" value="${rpeValue}" placeholder="1–10">
        <div class="unit">מאמץ</div>
      </div>
    </div>

    <div class="live-rec rec-neutral" id="liveRec">הזן את כל הנתונים לקבלת המלצה להמשך.</div>

    <div class="detail-actions">
      <button class="btn btn-complete" id="completeGroupBtn">✓ סיימתי את ${ex.nameHe}</button>
      <button class="btn btn-secondary" id="saveDraftBtn">שמור וחזור בלי לסמן כהושלם</button>
    </div>
  `;

  ['currentWeight','currentReps','currentRpe'].forEach(id=>{
    document.getElementById(id)?.addEventListener('input',updateLiveRecommendation);
  });
  document.getElementById('completeGroupBtn').addEventListener('click',()=>finishGroup(true));
  document.getElementById('saveDraftBtn').addEventListener('click',()=>finishGroup(false));
  updateLiveRecommendation();
}

function renderHistory(){
  const panel=document.getElementById('panel-history');
  const history=historyCache;

  const toolbar=`
    <div class="history-toolbar">
      <strong>${history.length} אימונים שמורים</strong>
      <div class="history-actions">
        <button class="btn btn-secondary" onclick="importJSON()">ייבוא JSON</button>
        <button class="btn btn-secondary" onclick="exportJSON()">ייצוא JSON</button>
        <button class="btn btn-secondary" onclick="exportExcel()">ייצוא Excel</button>
        <button class="btn btn-danger" onclick="clearHistory()">מחק הכל</button>
      </div>
    </div>`;

  if(!history.length){
    panel.innerHTML=toolbar+`<div class="empty">עדיין אין אימונים שמורים.</div>`;return;
  }

  panel.innerHTML=toolbar+history.map(session=>{
    const exs=session.exercises||[];
    const rpes=exs.map(e=>Number(e.rpe)).filter(v=>v>0);
    const avg=rpes.length?(rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1):'—';
    const rows=exs.map(ex=>{
      return `<tr>
        <td><strong>${ex.nameHe||ex.name||''}</strong><br><span style="color:var(--muted)">${ex.name||''}</span></td>
        <td>${ex.weight||'—'}</td>
        <td>${ex.reps||'—'} ${ex.repsLabel||''}</td>
        <td>${ex.rpe||'—'}</td>
        <td>${ex.recommendation||'—'}</td>
      </tr>`;
    }).join('');
    const meta=[];
    if(session.bodyWeight)meta.push(`משקל גוף: <strong>${session.bodyWeight} ק"ג</strong>`);
    if(session.bodyFat)meta.push(`שומן: <strong>${session.bodyFat}%</strong>`);
    if(session.rating)meta.push(`דירוג: <strong>${session.rating}/5</strong>`);
    if(session.note)meta.push(`הערה: <strong>${session.note}</strong>`);

    return `<div class="history-card">
      <div class="history-head" onclick="toggleHistory('${session.id}')">
        <div class="history-left">
          <span class="history-badge">גוף מלא</span>
          <div>
            <div class="history-date">${fmtDate(session.date)}</div>
            <div class="history-stats">${exs.length} תרגילים · RPE ממוצע ${avg}</div>
          </div>
        </div>
        <strong style="color:var(--primary)">פתח</strong>
      </div>
      <div class="history-body" id="history-${session.id}">
        ${meta.length?`<div class="history-meta">${meta.map(x=>`<span>${x}</span>`).join('')}</div>`:''}
        <table class="history-table">
          <thead><tr><th>תרגיל</th><th>משקל</th><th>חזרות</th><th>RPE</th><th>המלצה</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');
}
