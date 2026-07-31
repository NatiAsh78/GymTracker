document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    const target=tab.dataset.tab;
    document.getElementById(`panel-${target}`).classList.add('active');
    if(target==='history')renderHistory();
  });
});

document.getElementById('logoutBtn')?.addEventListener('click',async()=>{
  await signOut();
  location.reload();
});

async function bootApp(){
  showApp();
  const panel=document.getElementById('panel-workout');
  panel.innerHTML='<div class="empty">טוען נתונים מהענן…</div>';

  try{
    await loadExercises();
    await loadHistoryFromSupabase();
  }catch(err){
    console.error('Failed to load data from Supabase:',err);
    panel.innerHTML='<div class="empty">שגיאה בטעינת הנתונים מהענן. בדוק את החיבור לאינטרנט ורענן את הדף.</div>';
    return;
  }

  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-workout').classList.add('active');
  renderWorkout();
}

async function init(){
  const now=new Date();
  document.getElementById('headerDate').textContent=
    `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;

  let session=null;
  try{
    session=await getSession();
  }catch(err){
    console.error('Failed to check session:',err);
  }

  if(!session){
    renderLoginForm(async(email,password)=>{
      await signIn(email,password);
      await bootApp();
    });
    return;
  }

  await bootApp();
}

init();
